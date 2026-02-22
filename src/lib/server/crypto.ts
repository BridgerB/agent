import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getAdminSecrets } from './firebase';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const INITIALIZATION_VECTOR_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getKey = () => Buffer.from(getAdminSecrets().encryption_key, 'hex');

export const encrypt = (plaintext: string): string => {
	const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH);
	const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getKey(), initializationVector);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	return Buffer.concat([initializationVector, cipher.getAuthTag(), encrypted]).toString('base64');
};

export const decrypt = (encoded: string): string => {
	const buf = Buffer.from(encoded, 'base64');
	const initializationVector = buf.subarray(0, INITIALIZATION_VECTOR_LENGTH);
	const authTag = buf.subarray(
		INITIALIZATION_VECTOR_LENGTH,
		INITIALIZATION_VECTOR_LENGTH + AUTH_TAG_LENGTH
	);
	const encrypted = buf.subarray(INITIALIZATION_VECTOR_LENGTH + AUTH_TAG_LENGTH);
	const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getKey(), initializationVector);
	decipher.setAuthTag(authTag);
	return decipher.update(encrypted) + decipher.final('utf8');
};
