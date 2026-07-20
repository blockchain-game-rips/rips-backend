import { Logger } from '@nestjs/common'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import {
	CurrencyId,
	tokenIdSchema,
} from '../../domain/value-objects/currency-id'

export const PRICE_SEED_PATH = path.join(__dirname, 'price-cache.seed.json')

const priceSeedSchema = z.record(tokenIdSchema, z.number().positive())

export type PriceSeed = Map<CurrencyId, number>

export function loadPriceSeed(logger: Logger): PriceSeed {
	if (!fs.existsSync(PRICE_SEED_PATH)) {
		logger.warn(`Price seed file not found at ${PRICE_SEED_PATH}`)
		return new Map()
	}

	try {
		const raw: unknown = JSON.parse(
			fs.readFileSync(PRICE_SEED_PATH, 'utf-8'),
		)

		const parsed = priceSeedSchema.parse(raw)

		const seed: PriceSeed = new Map()

		for (const [currencyId, price] of Object.entries(parsed)) {
			const validId = tokenIdSchema.parse(currencyId)

			seed.set(validId, price)
		}

		return seed
	} catch (error) {
		logger.warn(`Failed to load price seed: ${String(error)}`)
		return new Map()
	}
}

export function serializePriceSeed(seed: PriceSeed): string {
	const record: Record<string, number> = {}

	for (const [currencyId, price] of seed) {
		record[currencyId] = price
	}

	return `${JSON.stringify(record, null, '\t')}\n`
}
