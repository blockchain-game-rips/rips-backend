import { Inject, Injectable } from '@nestjs/common'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import {
	encodeFunctionData,
	Hex,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'
import { ripsAbi } from './rips-abi'
import { KEEPER_PK, RIPS_SC_ADDRESS } from './rips.constants'

const CLAIM_START_INDEX = 0n
const CLAIM_MAX_RANGES = 100n

@Injectable()
export class RipsKeeperService {
	constructor(
		private readonly evmClientService: EvmClientService,

		@Inject(RIPS_SC_ADDRESS) private readonly contractAddress: Address,

		@Inject(KEEPER_PK) private readonly keeperPk: Hex,

		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {}

	async claim(roundId: number, userToClaim: Address): Promise<void> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'claimPrizes',
			args: [
				BigInt(roundId),
				CLAIM_START_INDEX,
				CLAIM_MAX_RANGES,
				userToClaim,
			],
		})

		await this.sendKeeperTransaction(data)
	}

	async refund(roundId: number, userToRefund: Address): Promise<void> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'refund',
			args: [BigInt(roundId), userToRefund],
		})

		await this.sendKeeperTransaction(data)
	}

	async requestVrf(roundId: number): Promise<void> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'requestRandomness',
			args: [BigInt(roundId)],
		})

		await this.sendKeeperTransaction(data)
	}

	private async sendKeeperTransaction(data: Hex): Promise<void> {
		if (!(this.mainCurrency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${this.mainCurrency.id}`)
		}

		const chainId = Number(this.mainCurrency.chainAddress.chain.reference)
		const account = privateKeyToAccount(this.keeperPk)
		const client = this.evmClientService.getClient(chainId)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data,
		}

		const tx = await client
			.prepareTransactionRequest({
				...request,
				account: account.address,
				chainId,
			})
			.catch((cause) => {
				throw new TransactionFailedError('Gas estimation failed', cause)
			})

		const signedTx = await account.signTransaction(tx)

		const txHash = await client.sendRawTransaction({
			serializedTransaction: signedTx,
		})

		const receipt = await client.waitForTransactionReceipt({ hash: txHash })

		if (receipt.status === 'reverted') {
			throw new TransactionFailedError(`Transaction reverted: ${txHash}`)
		}
	}
}
