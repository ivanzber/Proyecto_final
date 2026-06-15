import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';


export function decryptPayload(encryptedPayload: string, encryptionKey: string): string {
    const encryptedBuffer = Buffer.from(encryptedPayload, 'base64');

   
    const iv = encryptedBuffer.subarray(0, 16);
    const encryptedData = encryptedBuffer.subarray(16);

    
    const key = Buffer.from(encryptionKey, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

/**
 * Descifra las credenciales de login enviadas desde el frontend.
 * @returns { email: string, password: string }
 */
export function decryptLoginCredentials(
    encryptedPayload: string,
    encryptionKey: string,
): { email: string; password: string } {
    const decryptedString = decryptPayload(encryptedPayload, encryptionKey);

    try {
        const credentials = JSON.parse(decryptedString);

        if (!credentials.email || !credentials.password) {
            throw new Error('Credenciales incompletas');
        }

        return {
            email: credentials.email,
            password: credentials.password,
        };
    } catch {
        throw new Error('Error al descifrar las credenciales');
    }
}
