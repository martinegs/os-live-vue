<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de autenticación de usuarios.
 * Migrado desde server/routes/auth.js
 */
class AuthController extends Controller
{
    private const CI_ENCRYPTION_KEY = "6f;~d5df;.s.d.fwe";
    
    /**
     * POST /api/auth/login
     * Autentica un usuario con email y contraseña
     */
    public function login(Request $request)
    {
        $email = $request->input('email');
        $senha = $request->input('senha');
        
        // Log del intento
        $ip = $request->ip();
        Log::info("[auth] login attempt", ['email' => $email ?? '<missing>', 'ip' => $ip]);
        
        // Validación
        if (!$email || !$senha) {
            Log::warning('[auth] bad request: missing email or senha');
            return response()->json([
                'result' => false,
                'message' => 'Email y senha son requeridos'
            ], 400);
        }
        
        // Buscar usuario
        $user = DB::table('usuarios')
            ->where('email', $email)
            ->first();
            
        if (!$user) {
            Log::warning("[auth] user not found", ['email' => $email]);
            return response()->json([
                'result' => false,
                'message' => 'Credenciales invalidas'
            ], 401);
        }
        
        // Verificar contraseña
        $valid = $this->verifyPassword($user->senha, $senha);
        Log::info("[auth] verifyPassword result", [
            'user_id' => $user->idUsuarios,
            'valid' => $valid
        ]);
        
        if (!$valid) {
            return response()->json([
                'result' => false,
                'message' => 'Credenciales invalidas'
            ], 401);
        }
        
        // Preparar respuesta sin senha
        $safeUser = (array) $user;
        unset($safeUser['senha']);
        
        return response()->json([
            'result' => true,
            'user' => $safeUser
        ]);
    }
    
    /**
     * Verifica la contraseña usando el algoritmo de CodeIgniter 3
     * Compatible con decryptWithCodeIgniterMcrypt de Node.js
     */
    private function verifyPassword($encryptedPassword, $plainPassword)
    {
        if (!$encryptedPassword || !is_string($encryptedPassword)) {
            return false;
        }
        
        $trimmed = trim($encryptedPassword);
        $hmacHexLength = 128; // sha512 en hex
        
        if (strlen($trimmed) <= $hmacHexLength) {
            return false;
        }
        
        // Extraer el digest y el payload
        $digestHex = substr($trimmed, 0, $hmacHexLength);
        $payload = substr($trimmed, $hmacHexLength);
        
        // Derivar claves usando HKDF
        $keyBuf = self::CI_ENCRYPTION_KEY;
        $hmacKey = $this->hkdfSha512($keyBuf, 64, 'authentication');
        
        // Verificar HMAC
        $expectedDigest = hash_hmac('sha512', $payload, $hmacKey);
        
        if (!hash_equals($digestHex, $expectedDigest)) {
            return false;
        }
        
        // Derivar clave de cifrado usando la longitud del keyBuf original
        $encryptionKey = $this->hkdfSha512($keyBuf, strlen($keyBuf), 'encryption');
        
        // Determinar algoritmo basado en la longitud de la clave
        $keyLength = strlen($encryptionKey);
        if ($keyLength >= 32) {
            $algorithm = 'aes-256-cbc';
            $finalKey = substr($encryptionKey, 0, 32);
        } elseif ($keyLength >= 24) {
            $algorithm = 'aes-192-cbc';
            $finalKey = substr($encryptionKey, 0, 24);
        } elseif ($keyLength >= 16) {
            $algorithm = 'aes-128-cbc';
            $finalKey = substr($encryptionKey, 0, 16);
        } else {
            return false;
        }
        
        // Decodificar base64
        $decoded = base64_decode($payload);
        if ($decoded === false || strlen($decoded) < 16) {
            return false;
        }
        
        // Extraer IV y ciphertext
        $iv = substr($decoded, 0, 16);
        $ciphertext = substr($decoded, 16);
        
        // Descifrar
        $decrypted = openssl_decrypt(
            $ciphertext,
            $algorithm,
            $finalKey,
            OPENSSL_RAW_DATA,
            $iv
        );
        
        if ($decrypted === false) {
            return false;
        }
        
        // Comparar con contraseña en texto plano
        return hash_equals($decrypted, $plainPassword);
    }
    
    /**
     * Implementación HKDF con SHA-512
     */
    private function hkdfSha512($key, $length, $info = '', $salt = null)
    {
        $digestLength = 64; // SHA-512 produce 64 bytes
        
        if ($salt === null) {
            $salt = str_repeat("\0", $digestLength);
        }
        
        // Extract
        $prk = hash_hmac('sha512', $key, $salt, true);
        
        // Expand
        $t = '';
        $okm = '';
        $counter = 0;
        
        while (strlen($okm) < $length) {
            $counter++;
            $t = hash_hmac('sha512', $t . $info . chr($counter), $prk, true);
            $okm .= $t;
        }
        
        return substr($okm, 0, $length);
    }
}
