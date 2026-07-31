const crypto = require('crypto');

// AES block size is always 16 bytes for AES-256
const IV_LENGTH = 16;

/**
 * Encrypts a plaintext message using AES-256-CBC.
 * This ensures that if the database is breached, the messages cannot be read in plain text.
 * 
 * @param {string} text - The plain text message to encrypt.
 * @returns {string} - The encrypted string format: "iv:ciphertext" (both in hex)
 */
function encryptMessage(text) {
    if (!text) return text;
    try {
        // Fallback key in case environment variable is missing
        const secretKey = process.env.MESSAGE_ENCRYPTION_KEY || 'fallback_secret_key_viva_2026_xyz';

        // We use SHA-256 to ensure the key is exactly 32 bytes long, which is required for AES-256
        const key = crypto.createHash('sha256').update(String(secretKey)).digest();

        // Generate a random Initialization Vector (IV) for each message to ensure identical messages yield different ciphertexts
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create the cipher instance using AES-256 in Cipher Block Chaining (CBC) mode
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Return the IV and the encrypted data joined by a colon (both hex encoded)
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption Error:", error);
        throw new Error("Failed to encrypt message.");
    }
}

/**
 * Decrypts a ciphertext message back to plaintext.
 * This allows authorized users to read the message on the frontend.
 * 
 * @param {string} ciphertext - The encrypted string format: "iv:ciphertext"
 * @returns {string} - The decrypted plain text message.
 */
function decryptMessage(ciphertext) {
    if (!ciphertext) return ciphertext;

    try {
        const textParts = ciphertext.split(':');

        // If it's not encrypted in our expected format (e.g. legacy plain text messages), just return it
        if (textParts.length !== 2) return ciphertext;

        // Extract the IV and encrypted text back from hex
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');

        const secretKey = process.env.MESSAGE_ENCRYPTION_KEY || 'fallback_secret_key_viva_2026_xyz';

        // Recreate the exact same 32-byte key used for encryption
        const key = crypto.createHash('sha256').update(String(secretKey)).digest();

        // Create the decipher instance
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        // Decrypt the text
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        // Return as UTF-8 string
        return decrypted.toString('utf8');
    } catch (error) {
        console.error("Decryption Error:", error);
        // If decryption fails (e.g., wrong key), return a fallback error string rather than crashing the API
        return "[Error: Message could not be decrypted]";
    }
}

module.exports = {
    encryptMessage,
    decryptMessage
};
