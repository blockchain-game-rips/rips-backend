import { Anvil, setNativeBalance, useAnvil } from '@rips/test-harness'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
	createPublicClient,
	createWalletClient,
	http,
	isHex,
	keccak256,
	parseEther,
	parseSignature,
	serializeTransaction,
	type Hex,
	type TransactionSerializableEIP1559,
} from 'viem'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { base } from 'viem/chains'
import { EvmAddress } from '../../../src/domain/value-objects/evm-address'
import { toKmsKeyId } from '../../../src/domain/value-objects/kms-key-id'
import { FileKmsService } from '../../../src/infrastructure/kms/file-kms.service'

const FUNDED_BALANCE = parseEther('1')
const SEND_AMOUNT = parseEther('0.1')
const TRANSFER_GAS = 21000n
const RECIPIENT = '0x000000000000000000000000000000000000dEaD' as const

describe('FileKmsService integration', () => {
	const anvilInstance: Anvil = useAnvil({
		chainId: base.id,
	}).anvils[0]
	let kmsService: FileKmsService

	beforeAll(() => {
		const kmsStoreDir = mkdtempSync(join(tmpdir(), 'rips-kms-'))

		process.env.KMS_STORE_FILE = join(kmsStoreDir, 'kms-store.json')

		kmsService = new FileKmsService()
	})

	it('creates an EVM key and returns a valid checksummed address', async () => {
		const { kmsKeyId, evmAddress } = await kmsService.createEvmKey()

		expect(kmsKeyId).toBe(evmAddress)
		expect(evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('imports a supplied private key under its own address', async () => {
		const privateKey: Hex = generatePrivateKey()
		const expectedAddress = privateKeyToAddress(privateKey)

		const { kmsKeyId, evmAddress } =
			await kmsService.importEvmKey(privateKey)

		expect(evmAddress.toLowerCase()).toBe(expectedAddress.toLowerCase())
		expect(kmsKeyId).toBe(evmAddress)
	})

	it('signs with an imported key so the tx is accepted on-chain', async () => {
		const privateKey: Hex = generatePrivateKey()
		const { kmsKeyId, evmAddress } =
			await kmsService.importEvmKey(privateKey)

		const receipt = await signAndSend(kmsKeyId, evmAddress)

		expect(receipt.status).toBe('success')
		expect(receipt.from.toLowerCase()).toBe(evmAddress.toLowerCase())
	})

	it('signs a transaction and sends it on-chain', async () => {
		const { kmsKeyId, evmAddress } = await kmsService.createEvmKey()

		const receipt = await signAndSend(kmsKeyId, evmAddress)

		expect(receipt.status).toBe('success')
		expect(receipt.from.toLowerCase()).toBe(evmAddress.toLowerCase())
		expect(receipt.to?.toLowerCase()).toBe(RECIPIENT.toLowerCase())
	})

	async function signAndSend(kmsKeyId: string, evmAddress: EvmAddress) {
		const rpcUrl = `http://127.0.0.1:${anvilInstance.port}`

		const publicClient = createPublicClient({
			chain: base,
			transport: http(rpcUrl),
		})

		const walletClient = createWalletClient({
			chain: base,
			transport: http(rpcUrl),
		})

		await setNativeBalance(publicClient, evmAddress, FUNDED_BALANCE)

		const nonce = await publicClient.getTransactionCount({
			address: evmAddress,
		})
		const { maxFeePerGas, maxPriorityFeePerGas } =
			await publicClient.estimateFeesPerGas()

		const tx: TransactionSerializableEIP1559 = {
			chainId: base.id,
			to: RECIPIENT,
			value: SEND_AMOUNT,
			nonce,
			gas: TRANSFER_GAS,
			maxFeePerGas,
			maxPriorityFeePerGas,
		}

		const serializedUnsigned = serializeTransaction(tx)
		const hash = keccak256(serializedUnsigned)

		const signatureHex = await kmsService.signTransaction(
			toKmsKeyId(kmsKeyId),
			hash,
			evmAddress,
		)

		if (!isHex(signatureHex)) {
			throw new Error(`signTransaction returned non-hex: ${signatureHex}`)
		}

		const signature = parseSignature(signatureHex)
		const serializedSigned = serializeTransaction(tx, signature)

		const txHash = await walletClient.sendRawTransaction({
			serializedTransaction: serializedSigned,
		})

		return publicClient.waitForTransactionReceipt({ hash: txHash })
	}
})
