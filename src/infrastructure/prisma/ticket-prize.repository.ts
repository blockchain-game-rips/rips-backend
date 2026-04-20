import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from '../../application/interfaces/repositories/ticket-prize.repository'
import { Card } from '../../domain/value-objects/card'
import { CardCollection } from '../../domain/value-objects/card-collection'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { TicketPrize } from '../../domain/value-objects/ticket-prize'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaTicketPrizeRepository extends TicketPrizeRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getUnrevealed(userAddress: EvmAddress): Promise<TicketPrize[]> {
		const records = await this.prisma.ticketPrize.findMany({
			where: { userAddress, revealed: false },
			orderBy: { ticketNumber: 'asc' },
			include: { cardDefinition: true },
		})

		return records.map(toDomainTicketPrize)
	}

	async revealAndGet(userAddress: EvmAddress): Promise<TicketPrize | null> {
		return this.prisma.$transaction(async (tx) => {
			const record = await tx.ticketPrize.findFirst({
				where: { userAddress, revealed: false },
				orderBy: { ticketNumber: 'asc' },
				include: { cardDefinition: true },
			})

			if (!record) return null

			await tx.ticketPrize.update({
				where: { id: record.id },
				data: { revealed: true },
			})

			return toDomainTicketPrize(record)
		})
	}

	async revealAllAndGet(userAddress: EvmAddress): Promise<TicketPrize[]> {
		return this.prisma.$transaction(async (tx) => {
			const records = await tx.ticketPrize.findMany({
				where: { userAddress, revealed: false },
				orderBy: { ticketNumber: 'asc' },
				include: { cardDefinition: true },
			})

			if (records.length === 0) return []

			await tx.ticketPrize.updateMany({
				where: { userAddress, revealed: false },
				data: { revealed: true },
			})

			return records.map(toDomainTicketPrize)
		})
	}

	async getCardCollectionsByStake(
		userAddress: EvmAddress,
		stakeId: number,
	): Promise<CardCollection[]> {
		const cardDefinitions = await this.prisma.cardDefinition.findMany({
			where: { stakeId },
			include: {
				userCards: { where: { userAddress } },
			},
			orderBy: { tier: 'asc' },
		})

		const tierMap = new Map<number, CardCollection>()

		for (const def of cardDefinitions) {
			if (!tierMap.has(def.tier)) tierMap.set(def.tier, [])

			tierMap.get(def.tier)!.push({
				card: toCard(def),
				count: def.userCards[0]?.quantity ?? 0,
			})
		}

		return Array.from(tierMap.values())
	}

	async getCardDefinitionsByStake(stakeId: number): Promise<Card[][]> {
		const cardDefinitions = await this.prisma.cardDefinition.findMany({
			where: { stakeId },
			orderBy: { tier: 'asc' },
		})

		const tierMap = new Map<number, Card[]>()

		for (const def of cardDefinitions) {
			if (!tierMap.has(def.tier)) tierMap.set(def.tier, [])
			tierMap.get(def.tier)!.push(toCard(def))
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

function toDomainTicketPrize(record: {
	userAddress: string
	roundId: number
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
	cardDefinition: { id: bigint; tier: number; name: string; imageUrl: string }
}): TicketPrize {
	return {
		userAddress: toEvmAddress(record.userAddress),
		roundId: record.roundId,
		ticketNumber: record.ticketNumber,
		prizeAmount: record.prizeAmount,
		revealed: record.revealed,
		card: toCard(record.cardDefinition),
	}
}
