import type { Account, Address, WriteContractParameters } from 'viem'
import { createPublicClient, createWalletClient } from 'viem'

export type ContractCallParams = {
	address: Address
	abi: readonly unknown[]
	functionName: string
	args?: unknown[]
	account: Account
	value?: bigint
}

export async function writeAndWait(
	walletClient: ReturnType<typeof createWalletClient>,
	publicClient: ReturnType<typeof createPublicClient>,
	params: ContractCallParams,
): Promise<`0x${string}`> {
	const { abi, address, functionName, args, account, value } = params

	const callParams = {
		abi,
		address,
		functionName,
		args,
		account,
		chain: null,
		value,
	}

	const hash = await walletClient.writeContract(
		callParams as WriteContractParameters,
	)

	await publicClient.waitForTransactionReceipt({ hash })

	return hash
}
