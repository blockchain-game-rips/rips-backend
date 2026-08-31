import { createHash, timingSafeEqual } from 'node:crypto'

// timingSafeEqual throws on unequal buffer lengths, so hashing to a fixed
// width lets any two inputs be compared without leaking the secret's length.
function digest(value: string): Buffer {
	return createHash('sha256').update(value).digest()
}

export function safeCompare(a: string, b: string): boolean {
	return timingSafeEqual(digest(a), digest(b))
}
