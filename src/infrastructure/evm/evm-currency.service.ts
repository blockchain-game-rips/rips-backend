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
	NATIVE_CURRENCIES,
	WRAPPED_TOKENS,
} from './primitives/currencies/constants'
import { EvmCurrency } from './primitives/currencies/currency'
import {
	NATIVE_ADDRESS,
	NativeCurrency,
} from './primitives/currencies/native-currency'
import { Token } from './primitives/currencies/token'
import { WrappedNative } from './primitives/currencies/wrapped-native'

type TokenCacheKey = `${number}:${Address}`

@Injectable()
export class EvmCurrencyService {
	constructor(private readonly evmClientService: EvmClientService) {}
	/* ======== STATE ======== */

	private tokenCache: Map<TokenCacheKey, EvmCurrency> = new Map()

	/* ======== PUBLIC ======== */

	async getWrappedNative(chainId: number): Promise<WrappedNative> {
		const wrappedToken = WRAPPED_TOKENS[chainId]

		if (!wrappedToken) {
			throw new Error(`Wrapped Native not found for chain ${chainId}`)
		}

		return this.fromAddress<WrappedNative>(wrappedToken, chainId)
	}

	async fromAddress<T extends Token | NativeCurrency | WrappedNative>(
		address: Address,
		chainId: number,
	): Promise<T> {
		const checksumAddress = getAddress(address)
		const cacheKey = this.getCacheKey(checksumAddress, chainId)
		const cachedToken = this.tokenCache.get(cacheKey)

		if (cachedToken) {
			return cachedToken as T
		}

		if (this.isNative(checksumAddress)) {
			const token = this.createNative(chainId)

			this.tokenCache.set(
				this.getCacheKey(NATIVE_ADDRESS, chainId),
				token,
			)

			return token as T
		}

		const metadata = await this.getMetadataFromBlockchain(
			checksumAddress,
			chainId,
		)

		let token: T

		if (this.isWrappedNative(checksumAddress, chainId)) {
			token = new WrappedNative(
				this.evmClientService,
				this.getNative(chainId),
				chainId,
				metadata,
			) as T
		} else {
			token = new Token(
				this.evmClientService,
				checksumAddress,
				chainId,
				metadata,
			) as T
		}

		this.tokenCache.set(cacheKey, token)

		return token
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

		const metadata: CurrencyMetadata = {
			symbol,
			name,
			decimals,
		}

		return metadata
	}

	getNative(chainId: number): NativeCurrency {
		const cacheKey = this.getCacheKey(NATIVE_ADDRESS, chainId)
		const cachedToken = this.tokenCache.get(cacheKey)

		if (cachedToken) {
			return cachedToken as NativeCurrency
		}

		const token = this.createNative(chainId)

		this.tokenCache.set(cacheKey, token)

		return token
	}

	isValidTokenId(id: string) {
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
	): Promise<Token | NativeCurrency | WrappedNative> {
		const isValid = this.isValidTokenId(id)

		if (!isValid) {
			throw new Error('Invalid token id')
		}

		const [chainId, addr] = id.split(':')

		return await this.fromAddress(addr as Address, Number(chainId))
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

	isToken(address: Address): boolean {
		return !this.isNative(address)
	}

	/* ======== INTERNAL ======== */

	private getCacheKey(address: Address, chainId: number): TokenCacheKey {
		return `${chainId}:${address.toLowerCase() as Address}`
	}

	private createNative(chainId: number): NativeCurrency {
		const metadata = NATIVE_CURRENCIES[chainId] ?? ETH_METADATA

		return new NativeCurrency(this.evmClientService, chainId, metadata)
	}
}
