import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { AdminWallet } from '../../../domain/value-objects/wallet'

export type GetAdminWalletResult = {
	wallet: AdminWallet
	balance: CurrencyAmount
}

export abstract class GetAdminWalletUseCase {
	abstract execute(): Promise<GetAdminWalletResult>
}
