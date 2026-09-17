import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EvmCurrencyReadModule } from './evm-currency-read.module'
import { EvmCurrencyWriteService } from './evm-currency-write.service'
import { EvmTransactionService } from './evm-transaction.service'
import { NonceManagerService } from './nonce-manager.service'
import { TokenApprovalService } from './token-approval.service'
import { TransactionFeeService } from './transaction-fee.service'

@Module({
	imports: [EvmCurrencyReadModule, SignModule],
	providers: [
		EvmCurrencyWriteService,
		EvmTransactionService,
		NonceManagerService,
		TransactionFeeService,
		TokenApprovalService,
	],
	exports: [
		EvmCurrencyWriteService,
		EvmTransactionService,
		TransactionFeeService,
		TokenApprovalService,
	],
})
export class EvmCurrencyWriteModule {}
