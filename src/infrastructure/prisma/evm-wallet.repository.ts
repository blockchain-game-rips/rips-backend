import { Injectable } from '@nestjs/common'
import {
	EvmWalletRecord,
	EvmWalletRepository,
} from 'src/application/interfaces/repositories/evm-wallet.repository'
import { toKmsKeyId } from 'src/domain/value-objects/kms-key-id'
import { getAddress, type Address } from 'viem'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaEvmWalletRepository extends EvmWalletRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async findByAddress(address: Address): Promise<EvmWalletRecord | null> {
		const record = await this.prisma.evmWallet.findUnique({
			where: { address },
		})

		if (!record) return null

		return {
			kmsKeyId: toKmsKeyId(record.kmsKeyId),
			address: getAddress(record.address),
		}
	}
}
