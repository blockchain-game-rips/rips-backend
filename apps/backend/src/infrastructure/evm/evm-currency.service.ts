import { Inject, Injectable } from '@nestjs/common'
import {
	Address,
	erc20Abi,
	getAddress,
	getContract,
	isAddress,
	isAddressEqual,
	TransactionReceipt,
} from 'viem'
import { EIP155 } from '../../constants'
import { CurrencyMetadata } from '../../domain/entities/currency'
import {
	composeChainId,
	parseChainId,
} from '../../domain/services/chain-id-utils'
import {
	composeCurrencyId,
	parseCurrencyId,
} from '../../domain/services/currency-id-utils'
import {
	CurrencyId,
	currencyIdSchema,
} from '../../domain/value-objects/currency-id'
import { toEvmAddress } from '../../domain/value-objects/evm-address'
import { Transaction } from '../../domain/value-objects/transaction'
import {
	CURRENCY_METADATA_SOURCE,
	CurrencyMetadataSource,
} from '../currency-registry/currency-registry.interfaces'
import { EvmClientService } from './evm-client/evm-client.service'
import {
	NATIVE_ADDRESS,
	WRAPPED_TOKENS,
} from './primitives/currencies/constants'
import { EvmCurrency } from './primitives/currencies/evm-currency'
import { NativeCurrency } from './primitives/currencies/native-currency'
import { Token } from './primitives/currencies/token'
import { WrappedNative } from './primitives/currencies/wrapped-native'

@Injectable()
export class EvmCurrencyService {
	constructor(
		private readonly evmClientService: EvmClientService,
		@Inject(CURRENCY_METADATA_SOURCE)
		private readonly metadataSource: CurrencyMetadataSource,
	) {}

	/* ======== STATE ======== */

	private cache: Map<CurrencyId, EvmCurrency> = new Map()

	/* ======== PUBLIC ======== */

	async getWrappedNative(chainId: number): Promise<WrappedNative> {
		const wrappedToken = WRAPPED_TOKENS[chainId]

		if (!wrappedToken) {
			throw new Error(`Wrapped Native not found for chain ${chainId}`)
		}

		const currency = await this.fromAddress(wrappedToken, chainId)

		if (!(currency instanceof WrappedNative)) {
			throw new Error(`Expected WrappedNative for chain ${chainId}`)
		}

		return currency
	}

	async fromAddress(
		address: Address,
		chainId: number,
	): Promise<NativeCurrency | Token | WrappedNative> {
		const checksumAddress = getAddress(address)

		if (this.isNative(checksumAddress)) {
			return this.getNative(chainId)
		}

		const currencyId = composeCurrencyId(
			composeChainId(EIP155, String(chainId)),
			checksumAddress,
		)

		const knownMetadata = this.metadataSource.metadataOf(currencyId)

		const metadata =
			knownMetadata ??
			(await this.getMetadataFromBlockchain(checksumAddress, chainId))

		const currency = this.isWrappedNative(checksumAddress, chainId)
			? new WrappedNative(chainId, this.getNative(chainId), metadata)
			: new Token(checksumAddress, chainId, metadata)

		return this.getOrCache(currency)
	}

	toTransaction(receipt: TransactionReceipt, chainId: number): Transaction {
		const nativeCurrency = this.getNative(chainId)

		return {
			chain: nativeCurrency.chainAddress.chain,
			id: receipt.transactionHash,
			senderAddress: toEvmAddress(receipt.from),
			cost: {
				currency: nativeCurrency,
				amount: receipt.gasUsed * receipt.effectiveGasPrice,
			},
		}
	}

	getNative(chainId: number): NativeCurrency {
		const { nativeCurrency } = this.evmClientService.getChain(chainId)

		const metadata: CurrencyMetadata = {
			symbol: nativeCurrency.symbol,
			name: nativeCurrency.name,
			decimals: nativeCurrency.decimals,
		}

		const currency = new NativeCurrency(chainId, metadata)

		return this.getOrCache(currency)
	}

	isValidCurrencyId(id: string): boolean {
		const result = currencyIdSchema.safeParse(id)
		if (!result.success) {
			return false
		}

		const { address } = parseCurrencyId(result.data)
		return isAddress(address)
	}

	async fromId(
		id: CurrencyId,
	): Promise<NativeCurrency | Token | WrappedNative> {
		if (!this.isValidCurrencyId(id)) {
			throw new Error('Invalid currency id')
		}

		const { chainId, address } = parseCurrencyId(id)
		const { reference } = parseChainId(chainId)

		return this.fromAddress(getAddress(address), Number(reference))
	}

	/* ======== CHECKERS ======== */

	isNative(address: Address): boolean {
		return isAddressEqual(address, NATIVE_ADDRESS)
	}

	isWrappedNative(address: Address, chainId: number): boolean {
		const wrappedToken = WRAPPED_TOKENS[chainId]

		if (!wrappedToken) {
			return false
		}

		return isAddressEqual(address, wrappedToken)
	}

	/* ======== INTERNAL ======== */

	private getOrCache<T extends EvmCurrency>(currency: T): T {
		const cached = this.cache.get(currency.id)

		if (cached) {
			return cached as T
		}

		this.cache.set(currency.id, currency)

		return currency
	}

	private async getMetadataFromBlockchain(
		address: Address,
		chainId: number,
	): Promise<CurrencyMetadata> {
		const client = this.evmClientService.getClient(chainId)

		const contract = getContract({
			address,
			abi: erc20Abi,
			client,
		})

		const [decimals, name, symbol] = await Promise.all([
			contract.read.decimals(),
			contract.read.name(),
			contract.read.symbol(),
		])

		return { symbol, name, decimals }
	}
}
