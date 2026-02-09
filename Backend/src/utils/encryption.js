const crypto = require("crypto");

const algorithm = "aes-256-ctr";

// ✅ FIX: This function guarantees a 32-byte key from ANY password string
const getKey = () => {
  return crypto
    .createHash("sha256")
    .update(String(process.env.ENCRYPTION_KEY))
    .digest();
};

const ivLength = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(ivLength);
  // Use getKey() instead of raw env variable
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  };
};

const decrypt = (hash) => {
  if (!hash || !hash.iv || !hash.content) return null;
  // Use getKey() instead of raw env variable
  const decipher = crypto.createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(hash.iv, "hex"),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
};

module.exports = { encrypt, decrypt };
