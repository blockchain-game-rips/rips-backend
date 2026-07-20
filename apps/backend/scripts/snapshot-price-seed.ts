import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import fs from 'fs'
import { PriceProvider } from '../src/application/interfaces/price-service'
import { CurrencyId } from '../src/domain/value-objects/currency-id'
import { EvmCurrencyService } from '../src/infrastructure/evm/evm-currency.service'
import { KNOWN_TOKENS } from '../src/infrastructure/evm/primitives/currencies/constants'
import { PriceOracleModule } from '../src/infrastructure/price-provider/price-provider.module'
import {
	PRICE_SEED_PATH,
	PriceSeed,
	serializePriceSeed,
} from '../src/infrastructure/price-provider/price-seed'

@Module({
	imports: [PriceOracleModule.forRoot([])],
})
class SnapshotModule {}

async function main() {
	const app = await NestFactory.createApplicationContext(SnapshotModule, {
		logger: ['log', 'error', 'warn'],
	})

	const currencyService = app.get(EvmCurrencyService)
	const priceProvider = app.get(PriceProvider)

	const currencyIds: CurrencyId[] = Array.from(KNOWN_TOKENS.keys())

	const currencies = await Promise.all(
		currencyIds.map((id) => currencyService.fromId(id)),
	)

	const prices = await priceProvider.getPrices(currencies)

	const seed: PriceSeed = new Map()

	for (const currency of currencies) {
		const price = prices.get(currency.id)

		if (price === undefined) {
			throw new Error(`No price returned for ${currency.id}`)
		}

		seed.set(currency.id, price)
	}

	fs.writeFileSync(PRICE_SEED_PATH, serializePriceSeed(seed))

	await app.close()
}

void main()
