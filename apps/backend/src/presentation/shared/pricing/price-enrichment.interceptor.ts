import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common'
import { Observable, from, mergeMap } from 'rxjs'
import { PriceProvider } from '../../../application/interfaces/price-service'
import { Currency } from '../../../domain/entities/currency'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { collectPricedNodes } from './collect-priced-nodes'

const PRICE_UNAVAILABLE = 0

/**
 * Fills the `priceUsd` slot of every PricedCurrency in the response with a
 * single, deduped batch price fetch per request.
 */
@Injectable()
export class PriceEnrichmentInterceptor implements NestInterceptor {
	constructor(private readonly priceProvider: PriceProvider) {}

	intercept(
		_context: ExecutionContext,
		next: CallHandler,
	): Observable<unknown> {
		return next
			.handle()
			.pipe(mergeMap((response) => from(this.enrich(response))))
	}

	private async enrich(response: unknown): Promise<unknown> {
		const nodes = collectPricedNodes(response)

		if (nodes.length === 0) return response

		const uniqueCurrencies = new Map<CurrencyId, Currency>()

		for (const node of nodes) {
			uniqueCurrencies.set(node.currency.id, node.currency)
		}

		const prices = await this.priceProvider.getPrices(
			Array.from(uniqueCurrencies.values()),
		)

		for (const node of nodes) {
			node.priceUsd = prices.get(node.currency.id) ?? PRICE_UNAVAILABLE
		}

		return response
	}
}
