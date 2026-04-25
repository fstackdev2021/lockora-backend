const crypto = require("crypto");

const algorithm = "aes-256-ctr";

function getKey(userId) {
  return crypto
    .createHash("sha256")
    .update(process.env.SECRET_KEY + String(userId))
    .digest();
}

function encrypt(text, userId) {
  const iv = crypto.randomBytes(16);
  const key = getKey(userId);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(encryptedText, userId) {
  const [ivHex, contentHex] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const content = Buffer.from(contentHex, "hex");
  const key = getKey(userId);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(content),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };