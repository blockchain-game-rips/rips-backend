import { Injectable } from '@nestjs/common'
import { WalletRepository } from 'src/application/interfaces/repositories/wallet.repository'
import { ChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { KmsKeyId, toKmsKeyId } from 'src/domain/value-objects/kms-key-id'
import { Wallet } from 'src/domain/value-objects/wallet'
import { getAddress } from 'viem'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaWalletRepository extends WalletRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getKmsKeyId(
		wallet: Wallet,
		namespace: ChainNamespace,
	): Promise<KmsKeyId> {
		const address = getAddress(wallet.namespaceToAddress[namespace])

		switch (wallet.kind) {
			case 'user':
				return this.getUserKmsKeyId(address)
			case 'executor':
				return this.getExecutorKmsKeyId(address)
		}
	}

	private async getUserKmsKeyId(address: string): Promise<KmsKeyId> {
		const record = await this.prisma.evmWallet.findUnique({
			where: { address },
		})

		if (!record) {
			throw new Error(`User wallet not found for address ${address}`)
		}

		return toKmsKeyId(record.kmsKeyId)
	}

	private async getExecutorKmsKeyId(address: string): Promise<KmsKeyId> {
		const record = await this.prisma.executorWallet.findUnique({
			where: { address },
		})

		if (!record) {
			throw new Error(`Executor wallet not found for address ${address}`)
		}

		return toKmsKeyId(record.kmsKeyId)
	}
}
