import { ANVIL_ACCOUNT_0_PRIVATE_KEY, useAnvil } from '@rips/test-harness'
import { createCache } from 'cache-manager'
import {
	createPublicClient,
	custom,
	defineChain,
	fallback,
	http,
	isHex,
	parseEther,
	type Address,
	type Hex,
	type TransactionRequestEIP1559,
	type Transport,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import {
	EncryptedKey,
	EncryptionService,
} from '../../../src/application/interfaces/encryption.service'
import { WalletRepository } from '../../../src/application/interfaces/repositories/wallet.repository'
import { EIP155 } from '../../../src/constants'
import { toChainNamespace } from '../../../src/domain/value-objects/chain-namespace'
import {
	PrivateKey,
	toPrivateKey,
} from '../../../src/domain/value-objects/private-key'
import { Wallet } from '../../../src/domain/value-objects/wallet'
import { EvmClientService } from '../../../src/infrastructure/evm/evm-client/evm-client.service'
import { EvmCurrencyService } from '../../../src/infrastructure/evm/evm-currency.service'
import { EvmTransactionService } from '../../../src/infrastructure/evm/evm-transaction.service'
import { NonceManagerService } from '../../../src/infrastructure/evm/nonce-manager.service'
import { SignService } from '../../../src/infrastructure/sign/sign.service'

const CHAIN_ID = 31337

const SENDER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY
const RECIPIENT_ADDRESS: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

const TRANSFER_AMOUNT = parseEther('0.001')
const MAX_FEE_PER_GAS = parseEther('0.000000002')
const MAX_PRIORITY_FEE_PER_GAS = parseEther('0.000000001')

const NONCE_METHOD = 'eth_getTransactionCount'
const FILL_TRANSACTION_METHOD = 'eth_fillTransaction'

const NATIVE_METADATA = {
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
}

describe('consecutive transactions from one wallet', () => {
	const { anvils } = useAnvil({ chainId: CHAIN_ID })

	it('sends both transactions when the nonce read is stale', async () => {
		const service = buildTransactionService(
			`http://127.0.0.1:${anvils[0].port}`,
		)

		const sender = privateKeyToAccount(SENDER_PRIVATE_KEY)

		const wallet: Wallet = {
			kind: 'executor',
			namespaceToAddress: {
				[toChainNamespace(EIP155)]: sender.address,
			},
		}

		const request: TransactionRequestEIP1559 = {
			to: RECIPIENT_ADDRESS,
			value: TRANSFER_AMOUNT,
			maxFeePerGas: MAX_FEE_PER_GAS,
			maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
			type: 'eip1559',
		}

		const first = await service.sendTransaction(wallet, request, CHAIN_ID)
		const second = await service.sendTransaction(wallet, request, CHAIN_ID)

		expect(first.status).toBe('succeeded')
		expect(second.status).toBe('succeeded')
	})
})

/* ======== helpers ======== */

/** The wallet's key is fixed, so decryption is the identity on it. */
class StubEncryptionService extends EncryptionService {
	encrypt(): Promise<EncryptedKey> {
		return Promise.reject(new Error('signing only'))
	}

	decrypt(): Promise<PrivateKey> {
		return Promise.resolve(toPrivateKey(SENDER_PRIVATE_KEY))
	}
}

class StubWalletRepository extends WalletRepository {
	getEncryptedKey(): Promise<EncryptedKey> {
		return Promise.resolve({
			encryptedPrivateKey: new Uint8Array(),
			kekVersion: 'stub',
		})
	}
}

const anvilChain = (rpcUrl: string) =>
	defineChain({
		id: CHAIN_ID,
		name: 'Anvil',
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		rpcUrls: { default: { http: [rpcUrl] } },
	})

function buildTransactionService(rpcUrl: string): EvmTransactionService {
	const chain = anvilChain(rpcUrl)

	const evmClientService = new EvmClientService({ customChains: [chain] })

	const client = createPublicClient({
		chain,
		transport: fallback([stickyNonceTransport(rpcUrl)]),
	})

	evmClientService.getClient = () => client

	const evmCurrencyService = new EvmCurrencyService(evmClientService, {
		metadataOf: () => NATIVE_METADATA,
	})

	const signService = new SignService(
		new StubEncryptionService(),
		new StubWalletRepository(),
	)

	return new EvmTransactionService(
		evmClientService,
		evmCurrencyService,
		signService,
		new NonceManagerService(evmClientService, createCache()),
	)
}

/**
 * Models an eventually consistent RPC pool: whichever way the caller learns its
 * nonce, the answer comes from a replica that has not yet seen the caller's own
 * pending transaction. Every other method reaches the node directly.
 *
 * Both nonce sources are pinned, because the node picks the nonce itself via
 * `eth_fillTransaction` while a caller that manages the nonce locally reads
 * `eth_getTransactionCount`. Pinning only one would pass for the wrong reason.
 */
function stickyNonceTransport(rpcUrl: string): Transport {
	const chain = anvilChain(rpcUrl)
	const inner = http(rpcUrl)

	let pinnedNonce: Hex | undefined

	const pin = (nonce: Hex): Hex => {
		pinnedNonce ??= nonce

		return pinnedNonce
	}

	return custom({
		async request({ method, params }) {
			const { request: delegate } = inner({ chain })

			if (method === NONCE_METHOD) {
				return pin(parseHex(await delegate({ method, params })))
			}

			if (method === FILL_TRANSACTION_METHOD) {
				return withPinnedNonce(await delegate({ method, params }), pin)
			}

			return delegate({ method, params })
		},
	})
}

function parseHex(value: unknown): Hex {
	return z.custom<Hex>(isHex).parse(value)
}

/**
 * `eth_fillTransaction` answers with the node-filled fields under `tx`. Only
 * the nonce is rewritten, so the response stays shaped exactly as the node's.
 */
function withPinnedNonce(response: unknown, pin: (nonce: Hex) => Hex): unknown {
	const shape = z
		.looseObject({ tx: z.looseObject({ nonce: z.custom<Hex>(isHex) }) })
		.parse(response)

	return { ...shape, tx: { ...shape.tx, nonce: pin(shape.tx.nonce) } }
}
