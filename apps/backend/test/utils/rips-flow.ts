import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { deployments, setNativeBalance } from '@rips/test-harness'
import {
	createWalletClient,
	getAddress,
	http,
	type Address,
	type Hex,
	type TransactionReceipt,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
	EvmAddress,
	toEvmAddress,
} from '../../src/domain/value-objects/evm-address'
import { vrfCoordinatorAbi } from '../fixtures/vrf-coordinator-abi'
import { RipsApp } from './rips-app'
import { userRequest } from './user-request'

const RIPS_ADDRESS: Address = getAddress(deployments.rips)
const VRF_COORDINATOR_ADDRESS: Address = getAddress(deployments.vrfCoordinator)

export async function clearCache(ctx: RipsApp): Promise<void> {
	const cache = ctx.app.get<Cache>(CACHE_MANAGER)
	await cache.clear()
}

export function getRipsLogs(ctx: RipsApp) {
	return ctx.publicClient.getLogs({
		address: RIPS_ADDRESS,
		fromBlock: 0n,
	})
}

export async function createUserAndFund(
	ctx: RipsApp,
	telegramId: string,
	balance: bigint,
): Promise<EvmAddress> {
	await userRequest(ctx.app.getHttpServer())
		.post('/users')
		.send({ telegramId })
		.expect(201)

	const userRes = await userRequest(ctx.app.getHttpServer())
		.get(`/users/${telegramId}`)
		.expect(200)

	const address = toEvmAddress(userRes.body.wallets['eip155'])

	await setNativeBalance(ctx.publicClient, address, balance)

	return address
}

export async function fulfillRandomWords(
	ctx: RipsApp,
	keeperPrivateKey: Hex,
	requestId: bigint,
): Promise<TransactionReceipt> {
	const { chain, transport } = ctx.publicClient

	const walletClient = createWalletClient({
		account: privateKeyToAccount(keeperPrivateKey),
		chain,
		transport: http(transport.url),
	})

	const hash = await walletClient.writeContract({
		address: VRF_COORDINATOR_ADDRESS,
		abi: vrfCoordinatorAbi,
		functionName: 'fulfillRandomWords',
		args: [requestId, RIPS_ADDRESS],
	})

	const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash })

	expect(receipt.status).toBe('success')

	return receipt
}
