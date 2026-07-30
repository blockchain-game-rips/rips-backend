import { Injectable } from '@nestjs/common'
import { EntryPayoutRepository } from '../../application/interfaces/repositories/entry-payout.repository'
import { Card } from '../../domain/value-objects/card'
import { CardCollection } from '../../domain/value-objects/card-collection'
import { EntryPayout } from '../../domain/value-objects/entry-payout'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { PayoutFilter } from '../../domain/value-objects/payout-filter'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaEntryPayoutRepository extends EntryPayoutRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async find(
		userAddress: EvmAddress,
		{ ripId, revealed }: PayoutFilter,
	): Promise<EntryPayout[]> {
		const records = await this.prisma.entryPayout.findMany({
			where: { userAddress, ripId, revealed },
			orderBy: [{ ripId: 'asc' }, { entryNumber: 'asc' }],
			include: { cardDefinition: true },
		})

		return records.map(toDomainEntryPayout)
	}

	async revealAndGet(userAddress: EvmAddress): Promise<EntryPayout | null> {
		return this.prisma.$transaction(async (tx) => {
			const record = await tx.entryPayout.findFirst({
				where: { userAddress, revealed: false },
				orderBy: { entryNumber: 'asc' },
				include: { cardDefinition: true },
			})

			if (!record) return null

			await tx.entryPayout.update({
				where: { id: record.id },
				data: { revealed: true },
			})

			return toDomainEntryPayout(record)
		})
	}

	async revealAllAndGet(userAddress: EvmAddress): Promise<EntryPayout[]> {
		return this.prisma.$transaction(async (tx) => {
			const records = await tx.entryPayout.findMany({
				where: { userAddress, revealed: false },
				orderBy: { entryNumber: 'asc' },
				include: { cardDefinition: true },
			})

			if (records.length === 0) return []

			await tx.entryPayout.updateMany({
				where: { userAddress, revealed: false },
				data: { revealed: true },
			})

			return records.map(toDomainEntryPayout)
		})
	}

	async getCardCollections(
		userAddress: EvmAddress,
	): Promise<CardCollection[]> {
		const cardDefinitions = await this.prisma.cardDefinition.findMany({
			include: {
				userCards: { where: { userAddress } },
			},
			orderBy: { tier: 'asc' },
		})

		const tierMap = new Map<number, CardCollection>()

		for (const def of cardDefinitions) {
			const tier = tierMap.get(def.tier) ?? []

			tier.push({
				card: toCard(def),
				count: def.userCards[0]?.quantity ?? 0,
			})

			tierMap.set(def.tier, tier)
		}

		return Array.from(tierMap.values())
	}

	async getCardDefinitions(): Promise<Card[][]> {
		const cardDefinitions = await this.prisma.cardDefinition.findMany({
			orderBy: { tier: 'asc' },
		})

		const tierMap = new Map<number, Card[]>()

		for (const def of cardDefinitions) {
			const tier = tierMap.get(def.tier) ?? []

			tier.push(toCard(def))

			tierMap.set(def.tier, tier)
		}

		return Array.from(tierMap.values())
	}
}

function toCard(def: {
	id: bigint
	tier: number
	name: string
	imageUrl: string
}): Card {
	return {
		id: Number(def.id),
		tier: def.tier,
		name: def.name,
		imageUrl: def.imageUrl,
	}
}

function toDomainEntryPayout(record: {
	userAddress: string
	ripId: number
	entryNumber: number
	payoutAmount: bigint
	revealed: boolean
	cardDefinition: { id: bigint; tier: number; name: string; imageUrl: string }
}): EntryPayout {
	return {
		userAddress: toEvmAddress(record.userAddress),
		ripId: record.ripId,
		entryNumber: record.entryNumber,
		payoutAmount: record.payoutAmount,
		revealed: record.revealed,
		card: toCard(record.cardDefinition),
	}
}
