import {
	createWalletClient,
	custom,
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	HttpTransport,
	parseEther,
	PrivateKeyAccount,
	PublicClient,
	TransactionReceipt,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { Chain } from 'viem/chains'
import { ANVIL_ACCOUNT_0_PRIVATE_KEY } from '../fixtures/anvil-accounts'
import { setNativeBalance, waitForReceipt } from './anvil'

const DLN_DESTINATION_ADDRESSES: Record<number, string> = {
	8453: '0xe7351fd770a37282b91d153ee690b63579d6dd7f',
}

const DEFAULT_SOLVER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const ALLOWED_TAKER_ADDRESS_BYTES_LENGTH = 20

const createdOrderAbi = [
	{
		type: 'event',
		name: 'CreatedOrder',
		inputs: [
			{
				name: 'order',
				type: 'tuple',
				indexed: false,
				components: [
					{ name: 'makerOrderNonce', type: 'uint64' },
					{ name: 'makerSrc', type: 'bytes' },
					{ name: 'giveChainId', type: 'uint256' },
					{ name: 'giveTokenAddress', type: 'bytes' },
					{ name: 'giveAmount', type: 'uint256' },
					{ name: 'takeChainId', type: 'uint256' },
					{ name: 'takeTokenAddress', type: 'bytes' },
					{ name: 'takeAmount', type: 'uint256' },
					{ name: 'receiverDst', type: 'bytes' },
					{ name: 'givePatchAuthoritySrc', type: 'bytes' },
					{ name: 'orderAuthorityAddressDst', type: 'bytes' },
					{ name: 'allowedTakerDst', type: 'bytes' },
					{ name: 'allowedCancelBeneficiarySrc', type: 'bytes' },
					{ name: 'externalCall', type: 'bytes' },
				],
			},
			{ name: 'orderId', type: 'bytes32', indexed: false },
			{ name: 'affiliateFee', type: 'bytes', indexed: false },
			{ name: 'nativeFixFee', type: 'uint256', indexed: false },
			{ name: 'percentFee', type: 'uint256', indexed: false },
			{ name: 'referralCode', type: 'uint32', indexed: false },
			{ name: 'metadata', type: 'bytes', indexed: false },
		],
	},
] as const

const fulfillOrderAbi = [
	{
		type: 'function',
		name: 'fulfillOrder',
		inputs: [
			{
				name: '_order',
				type: 'tuple',
				components: [
					{ name: 'makerOrderNonce', type: 'uint64' },
					{ name: 'makerSrc', type: 'bytes' },
					{ name: 'giveChainId', type: 'uint256' },
					{ name: 'giveTokenAddress', type: 'bytes' },
					{ name: 'giveAmount', type: 'uint256' },
					{ name: 'takeChainId', type: 'uint256' },
					{ name: 'takeTokenAddress', type: 'bytes' },
					{ name: 'takeAmount', type: 'uint256' },
					{ name: 'receiverDst', type: 'bytes' },
					{ name: 'givePatchAuthoritySrc', type: 'bytes' },
					{ name: 'orderAuthorityAddressDst', type: 'bytes' },
					{ name: 'allowedTakerDst', type: 'bytes' },
					{ name: 'allowedCancelBeneficiarySrc', type: 'bytes' },
					{ name: 'externalCall', type: 'bytes' },
				],
			},
			{ name: '_fulFillAmount', type: 'uint256' },
			{ name: '_orderId', type: 'bytes32' },
			{ name: '_permitEnvelope', type: 'bytes' },
			{ name: '_unlockAuthority', type: 'address' },
			{ name: '_externalCallRewardBeneficiary', type: 'address' },
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const

export function parseCreatedOrderLog(receipt: TransactionReceipt) {
	const decoded = receipt.logs
		.map((log) => {
			try {
				return decodeEventLog({
					abi: createdOrderAbi,
					data: log.data,
					topics: log.topics,
				})
			} catch {
				return null
			}
		})
		.find((log) => log?.eventName === 'CreatedOrder')

	if (!decoded) {
		throw new Error('CreatedOrder event not found in transaction receipt')
	}

	return decoded.args
}

export async function fulfillDlnOrder(args: {
	srcTxHash: `0x${string}`
	srcPublicClient: PublicClient<HttpTransport, Chain>
	dstPublicClient: PublicClient<HttpTransport, Chain>
	solver?: PrivateKeyAccount
}): Promise<TransactionReceipt> {
	const { srcTxHash, srcPublicClient, dstPublicClient } = args

	const srcTxReceipt = await srcPublicClient.getTransactionReceipt({
		hash: srcTxHash,
	})

	const { order, orderId } = parseCreatedOrderLog(srcTxReceipt)

	const dstChain = dstPublicClient.chain
	const rpcUrl = dstPublicClient.transport.url

	const dlnDestination = DLN_DESTINATION_ADDRESSES[dstChain.id]

	if (!dlnDestination) {
		throw new Error(`No DlnDestination address for chain ${dstChain.id}`)
	}

	const takeAmount = order.takeAmount
	const GAS_RESERVE = parseEther('1')

	// If allowedTakerDst is set, impersonate that address — we can't sign with it
	const allowedTakerDst = order.allowedTakerDst
	const solverAddress =
		allowedTakerDst.length === ALLOWED_TAKER_ADDRESS_BYTES_LENGTH * 2 + 2
			? getAddress(`0x${allowedTakerDst.slice(-40)}`)
			: (args.solver ?? privateKeyToAccount(DEFAULT_SOLVER_PRIVATE_KEY))
					.address

	await setNativeBalance(
		dstPublicClient,
		solverAddress,
		takeAmount + GAS_RESERVE,
	)

	const fulfillData = encodeFunctionData({
		abi: fulfillOrderAbi,
		functionName: 'fulfillOrder',
		args: [order, takeAmount, orderId, '0x', solverAddress, solverAddress],
	})

	await dstPublicClient.request({
		// @ts-expect-error anvil method
		method: 'anvil_impersonateAccount',
		params: [solverAddress],
	})

	try {
		const impersonatedWallet = createWalletClient({
			account: solverAddress,
			chain: dstChain,
			transport: custom(dstPublicClient.transport),
		})

		return await waitForReceipt(
			impersonatedWallet.sendTransaction({
				to: getAddress(dlnDestination),
				data: fulfillData,
				value: takeAmount,
			}),
			dstPublicClient,
		)
	} finally {
		await dstPublicClient.request({
			// @ts-expect-error anvil method
			method: 'anvil_stopImpersonatingAccount',
			params: [solverAddress],
		})
	}
}
