import { Injectable } from '@nestjs/common'
import { CurrencyMetadata } from 'src/domain/entities/currency'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import {
	Address,
	erc20Abi,
	getAddress,
	getContract,
	isAddress,
	isAddressEqual,
} from 'viem'
import { EvmClientService } from './evm-client/evm-client.service'
import {
	ETH_METADATA,
	NATIVE_ADDRESS,
	NATIVE_CURRENCIES,
	WRAPPED_TOKENS,
} from './primitives/currencies/constants'
import { EvmCurrency } from './primitives/currencies/evm-currency'
import { NativeCurrency } from './primitives/currencies/native-currency'
import { Token } from './primitives/currencies/token'
import { WrappedNative } from './primitives/currencies/wrapped-native'

@Injectable()
export class EvmCurrencyService {
	constructor(private readonly evmClientService: EvmClientService) {}

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

		const metadata = await this.getMetadataFromBlockchain(
			checksumAddress,
			chainId,
		)

		const currency = this.isWrappedNative(checksumAddress, chainId)
			? new WrappedNative(chainId, this.getNative(chainId), metadata)
			: new Token(checksumAddress, chainId, metadata)

		return this.getOrCache(currency)
	}

	getNative(chainId: number): NativeCurrency {
		const currency = new NativeCurrency(
			chainId,
			NATIVE_CURRENCIES[chainId] ?? ETH_METADATA,
		)
		return this.getOrCache(currency)
	}

	isValidTokenId(id: string): boolean {
		try {
			const [chainId, addr] = id.split(':')

			if (!chainId || !addr) {
				return false
			}

			if (!isAddress(addr)) {
				return false
			}

			if (Number(chainId) <= 0) {
				return false
			}

			return true
		} catch {
			return false
		}
	}

	async fromId(
		id: CurrencyId,
	): Promise<NativeCurrency | Token | WrappedNative> {
		if (!this.isValidTokenId(id)) {
			throw new Error('Invalid token id')
		}

		const [chainId, addr] = id.split(':')

		return this.fromAddress(getAddress(addr), Number(chainId))
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
