import crypto from 'crypto';
function getEncryptionKey() {
    const secret = process.env.JWT_SECRET || 'sstechgroup-default-encryption-salt-2026';
    return crypto.createHash('sha256').update(secret).digest();
}
/**
 * Encrypt sensitive text (such as mailbox passwords) using AES-256-GCM.
 * Output format: ivHex:authTagHex:encryptedHex
 */
export function encryptCredential(plainText) {
    if (!plainText)
        return '';
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypt ciphertext encrypted with AES-256-GCM.
 */
export function decryptCredential(cipherText) {
    if (!cipherText)
        return '';
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3) {
            return cipherText;
        }
        const [ivHex, authTagHex, encryptedHex] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        console.error('Failed to decrypt credential:', err);
        return '***decryption_error***';
    }
}
