import * as nodeCrypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export interface EncryptedUserId {
    iv: string;
    ciphertext: string;
    authTag: string;
}


// getting and checking vals
const configuredKey = process.env.ENCRYPTION_KEY;
if (!configuredKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}
const isHexKey = configuredKey.length === 64 && /^[0-9a-f]+$/i.test(configuredKey);
const ENCRYPTION_KEY = Buffer.from(configuredKey, isHexKey ? 'hex' : 'base64');
if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to 32 bytes');
}

// getting and checking vals
const configuredLookupKey = process.env.LOOKUP_HMAC_KEY;
if (!configuredLookupKey) {
    throw new Error('LOOKUP_HMAC_KEY environment variable is required');
}
const LOOKUP_HMAC_KEY: string = configuredLookupKey;

export function encryptUserId(userId: string): EncryptedUserId {
    const iv: Buffer = nodeCrypto.randomBytes(12);

    const cipher: nodeCrypto.CipherGCM = nodeCrypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

    let encrypted: string = cipher.update(userId, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag: Buffer = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        ciphertext: encrypted,
        authTag: authTag.toString('hex')
    };
}

export function decryptUserId(encryptedData: EncryptedUserId): string {
    const decipher: nodeCrypto.DecipherGCM = nodeCrypto.createDecipheriv(
        'aes-256-gcm',
        ENCRYPTION_KEY,
        Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted: string = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function hmacLookup(value: string): Buffer {
    return nodeCrypto.createHmac('sha256', LOOKUP_HMAC_KEY).update(value, 'utf8').digest();
}

export function encryptValue(value: string): string {
    return JSON.stringify(encryptUserId(value));
}

export function decryptValue(value: string): string {
    return decryptUserId(JSON.parse(value) as EncryptedUserId);
}

export default {
    encryptUserId,
    decryptUserId,
    encryptValue,
    decryptValue,
    hmacLookup,
};
