import { Injectable, Logger } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { PrivateKey } from '../../../domain/value-objects/private-key'
import { EncryptionService } from '../../interfaces/encryption.service'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { WalletRepository } from '../../interfaces/repositories/wallet.repository'
import {
	ExportKeyInput,
	ExportKeyUseCase,
	UserNotFoundError,
} from './export-key.use-case'

@Injectable()
export class ExportKeyService extends ExportKeyUseCase {
	private readonly logger = new Logger(ExportKeyService.name)

	constructor(
		private readonly userRepository: UserRepository,
		private readonly walletRepository: WalletRepository,
		private readonly encryptionService: EncryptionService,
	) {
		super()
	}

	async execute(input: ExportKeyInput): Promise<PrivateKey> {
		const user = await this.userRepository.findByTelegramId(
			input.telegramId,
		)

		if (!user) {
			throw new UserNotFoundError(`User not found: ${input.telegramId}`)
		}

		const encryptedKey = await this.walletRepository.getEncryptedKey(
			user.wallet,
			EIP155,
		)

		const privateKey = await this.encryptionService.decrypt(encryptedKey)

		this.logger.log(
			`Private key exported for user ${user.id} (telegramId ${input.telegramId}), wallet ${user.wallet.namespaceToAddress[EIP155]}`,
		)

		return privateKey
	}
}
