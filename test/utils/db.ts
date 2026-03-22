import { DataSource } from 'typeorm'

const DEFAULT_TIMEOUT_MS = 15_000

export async function waitForRecord<T>(
	query: () => Promise<T | null | undefined>,
	timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		const result = await query()
		if (result != null) return result
		await new Promise((resolve) => setTimeout(resolve, 500))
	}

	throw new Error(`Timed out after ${timeoutMs}ms waiting for indexed record`)
}

export async function waitForRow(
	dataSource: DataSource,
	sql: string,
): Promise<unknown> {
	return waitForRecord(() =>
		dataSource.query(sql).then(([row]: unknown[]) => row ?? null),
	)
}
