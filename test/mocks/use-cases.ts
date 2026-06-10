import { CurrencyService } from '../../src/application/interfaces/currency.service'
import { KmsService } from '../../src/application/interfaces/kms.service'
import { PriceProvider } from '../../src/application/interfaces/price-service'
import { UserRepository } from '../../src/application/interfaces/repositories/user.repository'
import { WalletService } from '../../src/application/interfaces/wallet.service'
import { BuyTicketsPurchaseUseCase } from '../../src/application/use-cases/buy-tickets-purchase/buy-tickets-purchase.use-case'
import { BuyTicketsZapUseCase } from '../../src/application/use-cases/buy-tickets-zap/buy-tickets-zap.use-case'
import { CreateUserUseCase } from '../../src/application/use-cases/create-user/create-user.use-case'
import { GetBalanceUseCase } from '../../src/application/use-cases/get-balance/get-balance.use-case'
import { GetSwapResultUseCase } from '../../src/application/use-cases/get-swap-result/get-swap-result.use-case'
import { GetUnrevealedPrizesUseCase } from '../../src/application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { GetUserUseCase } from '../../src/application/use-cases/get-user/get-user.use-case'
import { QuoteSwapUseCase } from '../../src/application/use-cases/quote-swap/quote-swap.use-case'
import { QuoteWithdrawUseCase } from '../../src/application/use-cases/quote-withdraw/quote-withdraw.use-case'
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
	return {
		balanceOf: jest.fn(),
		transfer: jest.fn(),
		quoteTransfer: jest.fn(),
	}
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

export function makeMockPriceProvider(): jest.Mocked<PriceProvider> {
	return { getPrice: jest.fn(), getPrices: jest.fn() }
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

export function makeMockBuyTicketsPurchaseUseCase(): jest.Mocked<BuyTicketsPurchaseUseCase> {
	return { execute: jest.fn() }
}

export function makeMockBuyTicketsZapUseCase(): jest.Mocked<BuyTicketsZapUseCase> {
	return { execute: jest.fn() }
}

export function makeMockQuoteSwapUseCase(): jest.Mocked<QuoteSwapUseCase> {
	return { execute: jest.fn() }
}

export function makeMockQuoteWithdrawUseCase(): jest.Mocked<QuoteWithdrawUseCase> {
	return { execute: jest.fn() }
}

export function makeMockSwapUseCase(): jest.Mocked<SwapUseCase> {
	return { execute: jest.fn() }
}

export function makeMockGetSwapResultUseCase(): jest.Mocked<GetSwapResultUseCase> {
	return { execute: jest.fn() }
}

export function makeMockCurrencyService(): jest.Mocked<CurrencyService> {
	return { fromAccount: jest.fn() }
}
