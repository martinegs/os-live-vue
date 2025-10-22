import crypto from "crypto";

const HMAC_DIGEST = "sha512";
const HMAC_HEX_LENGTH = 128; // sha512 expressed in hex
const AES_BLOCK_SIZE = 16;
const HKDF_DIGEST_SIZE = 64; // digest size in bytes for sha512
const INFO_ENCRYPTION = Buffer.from("encryption", "utf8");
const INFO_AUTHENTICATION = Buffer.from("authentication", "utf8");

function hkdfSha512(sourceKey, length, info = Buffer.alloc(0), salt = null) {
  const ikm = Buffer.isBuffer(sourceKey) ? sourceKey : Buffer.from(sourceKey || "", "utf8");
  if (!ikm.length) {
    return Buffer.alloc(0);
  }

  const infoBuf = Buffer.isBuffer(info) ? info : Buffer.from(info || "", "utf8");
  const saltBuf =
    salt && salt.length
      ? Buffer.isBuffer(salt)
        ? salt
        : Buffer.from(salt)
      : Buffer.alloc(HKDF_DIGEST_SIZE, 0);

  const prk = crypto.createHmac(HMAC_DIGEST, saltBuf).update(ikm).digest();

  let previous = Buffer.alloc(0);
  const buffers = [];
  let blockIndex = 1;

  while (Buffer.concat(buffers).length < length && blockIndex <= 255) {
    const hmac = crypto.createHmac(HMAC_DIGEST, prk);
    hmac.update(previous);
    hmac.update(infoBuf);
    hmac.update(Buffer.from([blockIndex]));
    previous = hmac.digest();
    buffers.push(previous);
    blockIndex += 1;
  }

  return Buffer.concat(buffers).subarray(0, length);
}

function timingSafeHexEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || a.length % 2 !== 0) {
    return false;
  }

  try {
    const aBuf = Buffer.from(a, "hex");
    const bBuf = Buffer.from(b, "hex");
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function resolveCipherKey(derivedKey) {
  const length = derivedKey.length;

  if (length >= 32) {
    return { algorithm: "aes-256-cbc", key: derivedKey.subarray(0, 32) };
  }

  if (length >= 24) {
    return { algorithm: "aes-192-cbc", key: derivedKey.subarray(0, 24) };
  }

  if (length >= 16) {
    return { algorithm: "aes-128-cbc", key: derivedKey.subarray(0, 16) };
  }

  return { algorithm: null, key: null };
}

export function decryptWithCodeIgniterMcrypt(encrypted, masterKey) {
  if (typeof encrypted !== "string" || !encrypted.trim()) {
    return null;
  }

  const trimmed = encrypted.trim();
  if (trimmed.length <= HMAC_HEX_LENGTH) {
    return null;
  }

  const keyBuf = Buffer.from(masterKey || "", "utf8");
  if (!keyBuf.length) {
    return null;
  }

  const digestHex = trimmed.slice(0, HMAC_HEX_LENGTH);
  const payload = trimmed.slice(HMAC_HEX_LENGTH);

  const hmacKey = hkdfSha512(keyBuf, HKDF_DIGEST_SIZE, INFO_AUTHENTICATION);
  if (!hmacKey.length) {
    return null;
  }

  const expectedDigest = crypto.createHmac(HMAC_DIGEST, hmacKey).update(payload, "utf8").digest("hex");
  if (!timingSafeHexEquals(digestHex, expectedDigest)) {
    return null;
  }

  let payloadBuffer;
  try {
    payloadBuffer = Buffer.from(payload, "base64");
  } catch {
    return null;
  }

  if (payloadBuffer.length <= AES_BLOCK_SIZE) {
    return null;
  }

  const iv = payloadBuffer.subarray(0, AES_BLOCK_SIZE);
  const ciphertext = payloadBuffer.subarray(AES_BLOCK_SIZE);

  const derivedKey = hkdfSha512(keyBuf, keyBuf.length, INFO_ENCRYPTION);
  const { algorithm, key } = resolveCipherKey(derivedKey);
  if (!algorithm || !key) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Servicio de usuarios compatible con el login historico (CodeIgniter + mcrypt).
 */
export function createUserService({ pool, usersTable = "usuarios", ciEncryptionKey = null }) {
  const resolvedKey =
    typeof ciEncryptionKey === "string" && ciEncryptionKey.length
      ? ciEncryptionKey
      : "";

  return {
    async findByEmail(email) {
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query(
          `SELECT * FROM \`${usersTable}\` WHERE email = ? AND situacao = 1 LIMIT 1`,
          [email]
        );
        return rows[0] || null;
      } finally {
        conn.release();
      }
    },

    async verifyPassword(user, plainPassword) {
      if (!user || !user.senha || typeof plainPassword !== "string") {
        return false;
      }

      if (!resolvedKey) {
        console.warn("[userService] CI encryption key is missing; cannot validate password.");
        return false;
      }

      const decrypted = decryptWithCodeIgniterMcrypt(String(user.senha), resolvedKey);
      if (decrypted === null) {
        console.warn("[userService] Failed to decrypt senha using CodeIgniter-compatible routine.");
        return false;
      }

      return decrypted === plainPassword;
    },
  };
}
