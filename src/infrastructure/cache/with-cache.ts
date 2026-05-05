import { Cache } from '@nestjs/cache-manager'

export async function withCache<T>(
	cache: Cache,
	key: string,
	ttlMs: number,
	fn: () => Promise<T>,
): Promise<T> {
	const cached = await cache.get<T>(key)

	if (cached !== undefined) return cached

	const value = await fn()

	await cache.set(key, value, ttlMs)

	return value
}
