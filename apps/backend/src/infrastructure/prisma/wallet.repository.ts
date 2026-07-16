import { Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import { Bytes } from '../../../generated/prisma/runtime/client'
import { EncryptedKey } from '../../application/interfaces/encryption.service'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { ChainNamespace } from '../../domain/value-objects/chain-namespace'
import { Wallet } from '../../domain/value-objects/wallet'
import { PrismaService } from './prisma.service'

interface StoredKey {
	encryptedPrivateKey: Bytes
	kekVersion: string
}

@Injectable()
export class PrismaWalletRepository extends WalletRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getEncryptedKey(
		wallet: Wallet,
		namespace: ChainNamespace,
	): Promise<EncryptedKey> {
		const address = getAddress(wallet.namespaceToAddress[namespace])

		switch (wallet.kind) {
			case 'user':
				return this.getUserKey(address)
			case 'executor':
				return this.getExecutorKey(address)
			case 'admin':
				return this.getAdminKey(address)
		}
	}

	private async getUserKey(address: string): Promise<EncryptedKey> {
		const record = await this.prisma.evmWallet.findUnique({
			where: { address },
		})

		if (!record) {
			throw new Error(`User wallet not found for address ${address}`)
		}

		return toEncryptedKey(record)
	}

	private async getExecutorKey(address: string): Promise<EncryptedKey> {
		const record = await this.prisma.executorWallet.findUnique({
			where: { address },
		})

		if (!record) {
			throw new Error(`Executor wallet not found for address ${address}`)
		}

		return toEncryptedKey(record)
	}

	private async getAdminKey(address: string): Promise<EncryptedKey> {
		const record = await this.prisma.adminWallet.findUnique({
			where: { address },
		})

		if (!record) {
			throw new Error(`Admin wallet not found for address ${address}`)
		}

		return toEncryptedKey(record)
	}
}

function toEncryptedKey(record: StoredKey): EncryptedKey {
	return {
		encryptedPrivateKey: record.encryptedPrivateKey,
		kekVersion: record.kekVersion,
	}
}
