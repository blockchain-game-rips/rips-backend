import fs from 'fs'
import path from 'path'
import { EnrichedToken, enrichedRegistrySchema } from './enriched-token'

export const ENRICHED_REGISTRY_PATH = path.join(
	__dirname,
	'enriched-registry.json',
)

/**
 * Loads and validates the committed enriched registry. Fails loud: a missing,
 * unparseable, or schema-invalid artifact throws at startup rather than
 * silently booting an empty registry.
 */
export function loadEnrichedRegistry(
	filePath: string = ENRICHED_REGISTRY_PATH,
): EnrichedToken[] {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Enriched registry file not found at ${filePath}`)
	}

	const raw: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

	return enrichedRegistrySchema.parse(raw)
}
