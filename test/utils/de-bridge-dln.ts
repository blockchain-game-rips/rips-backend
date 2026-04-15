import {
	createWalletClient,
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	http,
	HttpTransport,
	parseEther,
	PublicClient,
	TransactionReceipt,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { Chain } from 'viem/chains'
import { setNativeBalance, waitForReceipt } from './anvil'

const DLN_DESTINATION_ADDRESSES: Record<number, string> = {
	8453: '0xe7351fd770a37282b91d153ee690b63579d6dd7f',
}

// Anvil account #1
const SOLVER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

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
	srcTxReceipt: TransactionReceipt
	dstPublicClient: PublicClient<HttpTransport, Chain>
}): Promise<TransactionReceipt> {
	const { srcTxReceipt, dstPublicClient } = args

	const { order, orderId } = parseCreatedOrderLog(srcTxReceipt)

	const dstChain = dstPublicClient.chain
	const rpcUrl = dstPublicClient.transport.url

	const dlnDestination = DLN_DESTINATION_ADDRESSES[dstChain.id]

	if (!dlnDestination) {
		throw new Error(`No DlnDestination address for chain ${dstChain.id}`)
	}

	const solver = privateKeyToAccount(SOLVER_PRIVATE_KEY)

	const takeAmount = order.takeAmount
	const GAS_RESERVE = parseEther('0.1')

	await setNativeBalance(
		dstPublicClient,
		solver.address,
		takeAmount + GAS_RESERVE,
	)

	const solverWallet = createWalletClient({
		account: solver,
		chain: dstChain,
		transport: http(rpcUrl),
	})

	const fulfillData = encodeFunctionData({
		abi: fulfillOrderAbi,
		functionName: 'fulfillOrder',
		args: [
			order,
			takeAmount,
			orderId,
			'0x',
			solver.address,
			solver.address,
		],
	})

	return waitForReceipt(
		solverWallet.sendTransaction({
			to: getAddress(dlnDestination),
			data: fulfillData,
			value: takeAmount,
		}),
		dstPublicClient,
	)
}
