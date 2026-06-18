import { Config } from '../../domain/entities/config'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../domain/value-objects/referral-system'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsAdminService {
	abstract pause(wallet: Wallet): Promise<Transaction>

	abstract unpause(wallet: Wallet): Promise<Transaction>

	abstract setReferrerFrozen(
		wallet: Wallet,
		args: { referrer: EvmAddress; frozen: boolean },
	): Promise<Transaction>

	abstract setDefaultReferralFee(
		wallet: Wallet,
		args: { feePercent: number },
	): Promise<Transaction>

	abstract updateStake(
		wallet: Wallet,
		args: { stakeId: number; config: Omit<Config, 'id'> },
	): Promise<Transaction>

	abstract setReferralTiers(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress; tiers: ReferrerTier[] },
	): Promise<Transaction>

	abstract setReferrerCustomFee(
		wallet: Wallet,
		args: { referrer: EvmAddress; feePercent: number },
	): Promise<Transaction>
}
