import { Config } from '../../domain/entities/config'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../domain/value-objects/referral-system'
import { TransactionAttempt } from '../../domain/value-objects/transaction-attempt'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsAdminService {
	abstract pause(wallet: Wallet): Promise<TransactionAttempt>

	abstract unpause(wallet: Wallet): Promise<TransactionAttempt>

	abstract setReferrerFrozen(
		wallet: Wallet,
		args: { referrer: EvmAddress; frozen: boolean },
	): Promise<TransactionAttempt>

	abstract setDefaultReferralFee(
		wallet: Wallet,
		args: { feeBps: number },
	): Promise<TransactionAttempt>

	abstract updatePreset(
		wallet: Wallet,
		args: { presetId: number; config: Omit<Config, 'id'> },
	): Promise<TransactionAttempt>

	abstract setReferralTiers(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress; tiers: ReferrerTier[] },
	): Promise<TransactionAttempt>

	abstract setReferrerCustomFee(
		wallet: Wallet,
		args: { referrer: EvmAddress; feeBps: number },
	): Promise<TransactionAttempt>

	abstract grantOperatorRole(
		wallet: Wallet,
		args: { operator: EvmAddress },
	): Promise<TransactionAttempt>
}
