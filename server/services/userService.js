import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Servicio simple para usuarios. Soporta detección de algoritmo de hash
 * (bcrypt, md5, sha1) y migración a bcrypt en el primer login exitoso.
 */
export function createUserService({ pool, usersTable = "usuarios" }) {
  return {
    async findByEmail(email) {
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query(
          `SELECT * FROM \`${usersTable}\` WHERE email = ? LIMIT 1`,
          [email]
        );
        return rows[0] || null;
      } finally {
        conn.release();
      }
    },

    async _updatePasswordToBcrypt(userId, plainPassword) {
      // Re-hash the password with bcrypt and update the DB (transparent migration)
      try {
        const hash = await bcrypt.hash(plainPassword, 10);
        const conn = await pool.getConnection();
        try {
          await conn.query(`UPDATE \`${usersTable}\` SET senha = ? WHERE idUsuarios = ?`, [hash, userId]);
          try {
            console.log(`[userService] migrated password to bcrypt for user id=${userId}`);
          } catch (e) {}
        } finally {
          conn.release();
        }
      } catch (err) {
        console.error('[userService] failed to migrate password to bcrypt', err);
      }
    },

    async verifyPassword(user, plainPassword) {
      if (!user || !user.senha) return false;
      const stored = String(user.senha).trim();
      // Diagnostic logging: don't log passwords, only metadata
      try {
        const uid = user.idUsuarios || user.id || user.id_users || 'unknown';
        console.log(`[userService] verifyPassword for user id=${uid}, storedLen=${stored.length}`);
        if (user.email) console.log(`[userService] email=${user.email}`);
        console.log(`[userService] stored senha (first 80):`, stored.slice(0,80));
      } catch (e) {
        // ignore logging errors
      }

      // bcrypt style (starts with $2a$ / $2b$ / $2y$)
      if (/^\$2[aby]\$/.test(stored)) {
        try {
          const ok = await bcrypt.compare(plainPassword, stored);
          console.log(`[userService] detected bcrypt for user, result=${ok}`);
          return ok;
        } catch (err) {
          return false;
        }
      }

      // Try pattern: leading hex (likely sha512) + trailing base64 (likely salt)
      // Example provided by user: <hex128><base64...>
      const hexBase64Match = stored.match(/^([a-f0-9]{64,128})([A-Za-z0-9+/=]+)$/i);
      if (hexBase64Match) {
        const hexPart = hexBase64Match[1];
        const saltB64 = hexBase64Match[2];
        console.log('[userService] detected hex+base64 pattern for senha; trying sha512/pbkdf2 variants');
        console.log('[userService] hexPart:', hexPart);
        console.log('[userService] saltB64:', saltB64);
        try {
          const salt = Buffer.from(saltB64, 'base64');

          // Try sha512(password + salt)
          const sha512a = crypto.createHash('sha512').update(plainPassword, 'utf8').update(salt).digest('hex');
          console.log('[userService] sha512(password+salt):', sha512a);
          if (sha512a === hexPart) {
            console.log('[userService] matched sha512(password+salt)');
            this._updatePasswordToBcrypt(user.idUsuarios || user.id || user.id_users || user.idUsuarios, plainPassword);
            return true;
          }

          // Try sha512(salt + password)
          const sha512b = crypto.createHash('sha512').update(salt).update(plainPassword, 'utf8').digest('hex');
          console.log('[userService] sha512(salt+password):', sha512b);
          if (sha512b === hexPart) {
            console.log('[userService] matched sha512(salt+password)');
            this._updatePasswordToBcrypt(user.idUsuarios || user.id || user.id_users || user.idUsuarios, plainPassword);
            return true;
          }

          // Try pbkdf2 with common iteration/keylen choices
          const iterationsList = [1000, 10000, 50000];
          const keyLenList = [32, 64];
          for (const iter of iterationsList) {
            for (const klen of keyLenList) {
              const derived = crypto.pbkdf2Sync(plainPassword, salt, iter, klen, 'sha512').toString('hex');
              console.log(`[userService] pbkdf2 iter=${iter} keylen=${klen}:`, derived);
              if (derived === hexPart) {
                console.log(`[userService] matched pbkdf2 iter=${iter} keylen=${klen}`);
                this._updatePasswordToBcrypt(user.idUsuarios || user.id || user.id_users || user.idUsuarios, plainPassword);
                return true;
              }
            }
          }
        } catch (err) {
          console.log('[userService] error en pruebas de hash:', err);
        }
      }

      // md5 hash (32 hex chars)
      if (/^[a-f0-9]{32}$/i.test(stored)) {
        const md5 = crypto.createHash('md5').update(plainPassword, 'utf8').digest('hex');
        const ok = md5 === stored;
        if (ok) {
          console.log('[userService] matched md5');
          // migrate to bcrypt asynchronously
          this._updatePasswordToBcrypt(user.idUsuarios || user.id || user.id_users || user.idUsuarios, plainPassword);
        }
        return ok;
      }

      // sha1 hash (40 hex chars)
      if (/^[a-f0-9]{40}$/i.test(stored)) {
        const sha1 = crypto.createHash('sha1').update(plainPassword, 'utf8').digest('hex');
        const ok = sha1 === stored;
        if (ok) {
          console.log('[userService] matched sha1');
          this._updatePasswordToBcrypt(user.idUsuarios || user.id || user.id_users || user.idUsuarios, plainPassword);
        }
        return ok;
      }

      // Fallbacks: try bcrypt compare (in case of other bcrypt prefixes) then plain equality
      try {
        const bcryptOk = await bcrypt.compare(plainPassword, stored);
        if (bcryptOk) {
          console.log('[userService] bcrypt compare fallback succeeded');
          return true;
        }
      } catch (err) {
        // ignore
      }

      // Direct text comparison (if stored as plain text)
      return stored === plainPassword;
    },
  };
}
