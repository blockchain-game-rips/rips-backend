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
		args: { feeBps: number },
	): Promise<Transaction>

	abstract updatePreset(
		wallet: Wallet,
		args: { presetId: number; config: Omit<Config, 'id'> },
	): Promise<Transaction>

	abstract setReferralTiers(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress; tiers: ReferrerTier[] },
	): Promise<Transaction>

	abstract setReferrerCustomFee(
		wallet: Wallet,
		args: { referrer: EvmAddress; feeBps: number },
	): Promise<Transaction>

	abstract grantOperatorRole(
		wallet: Wallet,
		args: { operator: EvmAddress },
	): Promise<Transaction>
}
