import { AdminWallet } from '../../../domain/value-objects/wallet'

export abstract class GetAdminWalletUseCase {
	abstract execute(): Promise<AdminWallet>
}
