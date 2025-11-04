import crypto from 'crypto'

const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassowrd(password: string) : {
    hash: string; salt: string
} {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
        .toString('hex');
    return {hash, salt};
}

export function verifyPassword(
    password: string,
    storedHash: string,
    storedSalt: string
) : boolean {
    const hash = crypto
        .pbkdf2Sync(password, storedSalt, ITERATIONS, KEY_LENGTH, DIGEST)
        .toString('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        Buffer.from(hash, 'hex')
    )
}