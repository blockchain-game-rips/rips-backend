import { DynamicModule, Module } from '@nestjs/common'
import {
	keccak256,
	parseSignature,
	serializeTransaction,
	TransactionSerializableEIP1559,
} from 'viem'
import { PrivateKeyAccount } from 'viem/accounts'
import { SignService } from '../../src/infrastructure/sign/sign.service'

// The real SignService reads an encrypted key through the Prisma-backed
// WalletRepository. Signing straight from a known account keeps that whole
// branch — and the database behind it — out of the test.
function signWith(account: PrivateKeyAccount): Pick<SignService, 'signTx'> {
	return {
		signTx: async (_wallet, tx: TransactionSerializableEIP1559) => {
			const serializedUnsigned = serializeTransaction(tx)
			const hash = keccak256(serializedUnsigned)
			const signatureHex = await account.sign({ hash })
			const signature = parseSignature(signatureHex)

			return serializeTransaction(tx, signature)
		},
	}
}

@Module({})
export class MockSignModule {
	static withAccount(account: PrivateKeyAccount): DynamicModule {
		return {
			module: MockSignModule,
			providers: [{ provide: SignService, useValue: signWith(account) }],
			exports: [SignService],
		}
	}
}
