import { CurrencyService } from '../../src/application/interfaces/currency.service'
import { KmsService } from '../../src/application/interfaces/kms.service'
import { UserRepository } from '../../src/application/interfaces/repositories/user.repository'
import { WalletService } from '../../src/application/interfaces/wallet.service'
import { CreateUserUseCase } from '../../src/application/use-cases/create-user/create-user.use-case'
import { GetBalanceUseCase } from '../../src/application/use-cases/get-balance/get-balance.use-case'
import { GetPriceUseCase } from '../../src/application/use-cases/get-price/get-price.use-case'
import { GetUnrevealedPrizesUseCase } from '../../src/application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { GetUserUseCase } from '../../src/application/use-cases/get-user/get-user.use-case'
import { QuoteSwapUseCase } from '../../src/application/use-cases/quote-swap/quote-swap.use-case'
import { RevealTicketPrizesUseCase } from '../../src/application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import { SwapUseCase } from '../../src/application/use-cases/swap/swap.use-case'
import { WithdrawUseCase } from '../../src/application/use-cases/withdraw.ts/withdraw.use-case'
import { EVM_ADDRESS } from '../fixtures/entities'

const KMS_KEY_ID = 'kms-key-123'

export function makeMockUserRepository(): jest.Mocked<UserRepository> {
	return {
		findByTelegramId: jest.fn(),
		findByEvmAddress: jest.fn(),
		create: jest.fn(),
		setReferrer: jest.fn(),
	}
}

export function makeMockWalletService(): jest.Mocked<WalletService> {
	return { balanceOf: jest.fn(), transfer: jest.fn() }
}

export function makeMockKmsService(): jest.Mocked<KmsService> {
	return {
		createEvmKey: jest.fn().mockResolvedValue({
			kmsKeyId: KMS_KEY_ID,
			evmAddress: EVM_ADDRESS,
		}),
		signTransaction: jest.fn(),
	}
}

export function makeMockGetUserUseCase(): jest.Mocked<GetUserUseCase> {
	return { execute: jest.fn() }
}

export function makeMockCreateUserUseCase(): jest.Mocked<CreateUserUseCase> {
	return { execute: jest.fn() }
}

export function makeMockSetReferrerUseCase(): jest.Mocked<GetUserUseCase> {
	return { execute: jest.fn() }
}

export function makeMockGetBalanceUseCase(): jest.Mocked<GetBalanceUseCase> {
	return { execute: jest.fn() }
}

export function makeMockGetPriceUseCase(): jest.Mocked<GetPriceUseCase> {
	return { execute: jest.fn(), executeMany: jest.fn() }
}

export function makeMockRevealTicketPrizesUseCase(): jest.Mocked<RevealTicketPrizesUseCase> {
	return { execute: jest.fn() }
}

export function makeMockGetUnrevealedPrizesUseCase(): jest.Mocked<GetUnrevealedPrizesUseCase> {
	return { execute: jest.fn() }
}

export function makeMockWithdrawUseCase(): jest.Mocked<WithdrawUseCase> {
	return { execute: jest.fn() }
}

export function makeMockQuoteSwapUseCase(): jest.Mocked<QuoteSwapUseCase> {
	return { execute: jest.fn() }
}

export function makeMockSwapUseCase(): jest.Mocked<SwapUseCase> {
	return { execute: jest.fn() }
}

export function makeMockCurrencyService(): jest.Mocked<CurrencyService> {
	return { fromAccount: jest.fn() }
}
