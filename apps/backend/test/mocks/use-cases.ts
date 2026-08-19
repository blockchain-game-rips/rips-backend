import { Mocked, vi } from 'vitest'
import { CurrencyService } from '../../src/application/interfaces/currency.service'
import { EncryptionService } from '../../src/application/interfaces/encryption.service'
import { EntryPayoutRepository } from '../../src/application/interfaces/repositories/entry-payout.repository'
import { UserRepository } from '../../src/application/interfaces/repositories/user.repository'
import { WalletReadService } from '../../src/application/interfaces/wallet-read.service'
import { WalletWriteService } from '../../src/application/interfaces/wallet-write.service'
import { BuyEntriesPurchaseUseCase } from '../../src/application/use-cases/buy-entries-purchase/buy-entries-purchase.use-case'
import { BuyEntriesZapUseCase } from '../../src/application/use-cases/buy-entries-zap/buy-entries-zap.use-case'
import { CreateUserUseCase } from '../../src/application/use-cases/create-user/create-user.use-case'
import { ExportKeyUseCase } from '../../src/application/use-cases/export-key/export-key.use-case'
import { GetBalanceUseCase } from '../../src/application/use-cases/get-balance/get-balance.use-case'
import { GetPayoutsUseCase } from '../../src/application/use-cases/get-payouts/get-payouts.use-case'
import { GetSwapResultUseCase } from '../../src/application/use-cases/get-swap-result/get-swap-result.use-case'
import { GetUserUseCase } from '../../src/application/use-cases/get-user/get-user.use-case'
import { QuoteSwapUseCase } from '../../src/application/use-cases/quote-swap/quote-swap.use-case'
import { QuoteWithdrawUseCase } from '../../src/application/use-cases/quote-withdraw/quote-withdraw.use-case'
import { RevealEntryPayoutsUseCase } from '../../src/application/use-cases/reveal-entry-payouts/reveal-entry-payouts.use-case'
import { SwapUseCase } from '../../src/application/use-cases/swap/swap.use-case'
import { WithdrawUseCase } from '../../src/application/use-cases/withdraw.ts/withdraw.use-case'
import { ENCRYPTED_KEY } from '../fixtures/entities'

export function makeMockUserRepository(): Mocked<UserRepository> {
	return {
		findByTelegramId: vi.fn(),
		findByEvmAddress: vi.fn(),
		create: vi.fn(),
		setReferrer: vi.fn(),
	}
}

export function makeMockEntryPayoutRepository(): Mocked<EntryPayoutRepository> {
	return {
		find: vi.fn(),
		revealAndGet: vi.fn(),
		revealAllAndGet: vi.fn(),
		getAssignedCardCollections: vi.fn(),
		getRevealedCardCollections: vi.fn(),
		getCardDefinitions: vi.fn(),
	}
}

export function makeMockWalletReadService(): Mocked<WalletReadService> {
	return {
		balanceOf: vi.fn(),
		balancesOf: vi.fn(),
	}
}

export function makeMockWalletWriteService(): Mocked<WalletWriteService> {
	return {
		transfer: vi.fn(),
		quoteTransfer: vi.fn(),
	}
}

export function makeMockEncryptionService(): Mocked<EncryptionService> {
	return {
		encrypt: vi.fn().mockResolvedValue(ENCRYPTED_KEY),
		decrypt: vi.fn(),
	}
}

export function makeMockGetUserUseCase(): Mocked<GetUserUseCase> {
	return { execute: vi.fn() }
}

export function makeMockCreateUserUseCase(): Mocked<CreateUserUseCase> {
	return { execute: vi.fn() }
}

export function makeMockSetReferrerUseCase(): Mocked<GetUserUseCase> {
	return { execute: vi.fn() }
}

export function makeMockExportKeyUseCase(): Mocked<ExportKeyUseCase> {
	return { execute: vi.fn() }
}

export function makeMockGetBalanceUseCase(): Mocked<GetBalanceUseCase> {
	return { execute: vi.fn() }
}

export function makeMockRevealEntryPayoutsUseCase(): Mocked<RevealEntryPayoutsUseCase> {
	return { execute: vi.fn() }
}

export function makeMockGetPayoutsUseCase(): Mocked<GetPayoutsUseCase> {
	return { execute: vi.fn() }
}

export function makeMockWithdrawUseCase(): Mocked<WithdrawUseCase> {
	return { execute: vi.fn() }
}

export function makeMockBuyEntriesPurchaseUseCase(): Mocked<BuyEntriesPurchaseUseCase> {
	return { execute: vi.fn() }
}

export function makeMockBuyEntriesZapUseCase(): Mocked<BuyEntriesZapUseCase> {
	return { execute: vi.fn() }
}

export function makeMockQuoteSwapUseCase(): Mocked<QuoteSwapUseCase> {
	return { execute: vi.fn() }
}

export function makeMockQuoteWithdrawUseCase(): Mocked<QuoteWithdrawUseCase> {
	return { execute: vi.fn() }
}

export function makeMockSwapUseCase(): Mocked<SwapUseCase> {
	return { execute: vi.fn() }
}

export function makeMockGetSwapResultUseCase(): Mocked<GetSwapResultUseCase> {
	return { execute: vi.fn() }
}

export function makeMockCurrencyService(): Mocked<CurrencyService> {
	return { fromAccount: vi.fn() }
}
