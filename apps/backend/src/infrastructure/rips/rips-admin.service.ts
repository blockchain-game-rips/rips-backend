import { Inject, Injectable } from '@nestjs/common'
import { encodeFunctionData, type TransactionRequestEIP1559 } from 'viem'
import { RipsAdminService } from '../../application/interfaces/rips-admin.service'
import { Config } from '../../domain/entities/config'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../domain/value-objects/referral-system'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { ripsAbi } from './rips-abi'
import { OPERATOR_ROLE, RIPS_CONTRACT } from './rips.constants'

@Injectable()
export class RipsAdminServiceImpl extends RipsAdminService {
	private readonly contractAddress: EvmAddress
	private readonly chainId: number

	constructor(
		private readonly evmTransactionService: EvmTransactionService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.contractAddress = toEvmAddress(contract.address)
		this.chainId = Number(contract.chain.reference)
	}

	pause(wallet: Wallet): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'pause',
				args: [],
			}),
		})
	}

	unpause(wallet: Wallet): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'unpause',
				args: [],
			}),
		})
	}

	setReferrerFrozen(
		wallet: Wallet,
		args: { referrer: EvmAddress; frozen: boolean },
	): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'setReferrerFrozen',
				args: [args.referrer, args.frozen],
			}),
		})
	}

	updatePreset(
		wallet: Wallet,
		args: { presetId: number; config: Omit<Config, 'id'> },
	): Promise<Transaction> {
		const { presetId, config } = args

		const currencyAddress = toEvmAddress(
			config.entryPrice.currency.chainAddress.address,
		)

		const entryPrice = BigInt(config.entryPrice.amount)

		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'updatePreset',
				args: [
					BigInt(presetId),
					{
						tiers: config.payoutDistribution,
						currency: currencyAddress,
						entryCap: BigInt(config.entryCap),
						duration: config.durationSeconds,
						entryPrice: entryPrice,
						feeBps: config.feeBps,
					},
				],
			}),
		})
	}

	setReferralTiers(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress; tiers: ReferrerTier[] },
	): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'setReferralTiers',
				args: [args.currencyAddress, args.tiers],
			}),
		})
	}

	setDefaultReferralFee(
		wallet: Wallet,
		args: { feeBps: number },
	): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'setDefaultReferralFee',
				args: [args.feeBps],
			}),
		})
	}

	setReferrerCustomFee(
		wallet: Wallet,
		args: { referrer: EvmAddress; feeBps: number },
	): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'setReferrerCustomFee',
				args: [args.referrer, args.feeBps],
			}),
		})
	}

	grantOperatorRole(
		wallet: Wallet,
		args: { operator: EvmAddress },
	): Promise<Transaction> {
		return this.sendAdminTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'grantRole',
				args: [OPERATOR_ROLE, args.operator],
			}),
		})
	}

	private async sendAdminTransaction(
		wallet: Wallet,
		requestFields: Pick<TransactionRequestEIP1559, 'data'>,
	): Promise<Transaction> {
		const request: TransactionRequestEIP1559 = {
			...requestFields,
			to: this.contractAddress,
		}

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				this.chainId,
			)

		return transaction
	}
}
