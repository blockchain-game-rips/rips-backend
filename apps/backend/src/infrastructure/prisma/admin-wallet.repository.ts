import { Injectable } from '@nestjs/common'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { EIP155 } from '../../constants'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'
import { AdminWallet } from '../../domain/value-objects/wallet'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaAdminWalletRepository extends AdminWalletRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async get(): Promise<AdminWallet | null> {
		const record = await this.prisma.adminWallet.findUnique({
			where: { singleton: 'admin' },
		})

		if (!record) return null

		return toAdminWallet(record.address)
	}

	async upsert(
		address: EvmAddress,
		kmsKeyId: KmsKeyId,
	): Promise<AdminWallet> {
		await this.prisma.adminWallet.upsert({
			where: { singleton: 'admin' },
			update: {},
			create: { address, kmsKeyId },
		})

		return toAdminWallet(address)
	}
}

function toAdminWallet(address: string): AdminWallet {
	return {
		kind: 'admin',
		namespaceToAddress: { [EIP155]: toEvmAddress(address) },
	}
}
