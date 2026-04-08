import { MnemonicKmsService } from 'src/infrastructure/kms/mnemonic-kms.service'
import {
	createPublicClient,
	createWalletClient,
	http,
	keccak256,
	parseEther,
	parseSignature,
	serializeTransaction,
	type TransactionSerializableEIP1559,
} from 'viem'
import { base } from 'viem/chains'
import { Anvil, setNativeBalance, useAnvil } from '../../utils/anvil'

const TEST_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const FUNDED_BALANCE = parseEther('1')

describe('MnemonicKmsService integration', () => {
	const anvilInstance: Anvil = useAnvil({
		chainId: base.id,
	}).anvils[0]
	let kmsService: MnemonicKmsService

	beforeAll(() => {
		process.env.KMS_MNEMONIC = TEST_MNEMONIC
		kmsService = new MnemonicKmsService()
	})

	it('creates an EVM key and returns a valid checksummed address', async () => {
		const { kmsKeyId, evmAddress } = await kmsService.createEvmKey()

		expect(kmsKeyId).toMatch(/^\d+$/)
		expect(evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('signs a transaction and sends it on-chain', async () => {
		const { kmsKeyId, evmAddress: evmAddressStr } =
			await kmsService.createEvmKey()
		const evmAddress = evmAddressStr as `0x${string}`

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

		const recipient = '0x000000000000000000000000000000000000dEaD' as const
		const sendAmount = parseEther('0.1')

		const nonce = await publicClient.getTransactionCount({
			address: evmAddress,
		})
		const { maxFeePerGas, maxPriorityFeePerGas } =
			await publicClient.estimateFeesPerGas()

		const tx: TransactionSerializableEIP1559 = {
			chainId: base.id,
			to: recipient,
			value: sendAmount,
			nonce,
			gas: 21000n,
			maxFeePerGas,
			maxPriorityFeePerGas,
		}

		const serializedUnsigned = serializeTransaction(tx)
		const hash = keccak256(serializedUnsigned)

		const signatureHex = await kmsService.signTransaction(
			kmsKeyId,
			hash,
			evmAddress,
		)
		const signature = parseSignature(signatureHex as `0x${string}`)
		const serializedSigned = serializeTransaction(tx, signature)

		const txHash = await walletClient.sendRawTransaction({
			serializedTransaction: serializedSigned,
		})

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		})

		expect(receipt.status).toBe('success')
		expect(receipt.from.toLowerCase()).toBe(evmAddress.toLowerCase())
		expect(receipt.to?.toLowerCase()).toBe(recipient.toLowerCase())
	})
})
