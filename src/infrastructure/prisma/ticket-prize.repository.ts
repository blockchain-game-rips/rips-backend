import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { Card } from 'src/domain/value-objects/card'
import { CardCollection } from 'src/domain/value-objects/card-collection'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaTicketPrizeRepository extends TicketPrizeRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async upsertMany(userId: bigint, prizes: TicketPrize[]): Promise<void> {
		await this.prisma.$transaction(
			prizes.map((prize) =>
				this.prisma.ticketPrize.upsert({
					where: {
						roundId_ticketNumber: {
							roundId: prize.roundId,
							ticketNumber: prize.ticketNumber,
						},
					},
					create: {
						userId,
						roundId: prize.roundId,
						ticketNumber: prize.ticketNumber,
						prizeAmount: prize.prizeAmount,
						cardDefinitionId: BigInt(prize.card.id),
					},
					update: { prizeAmount: prize.prizeAmount },
				}),
			),
		)
	}

	async getUnrevealed(userId: bigint): Promise<TicketPrize[]> {
		const records = await this.prisma.ticketPrize.findMany({
			where: { userId, revealed: false },
			orderBy: { ticketNumber: 'asc' },
			include: { cardDefinition: true },
		})

		return records.map(toDomainTicketPrize)
	}

	async revealAndGet(userId: bigint): Promise<TicketPrize | null> {
		return this.prisma.$transaction(async (tx) => {
			const record = await tx.ticketPrize.findFirst({
				where: { userId, revealed: false },
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

	async revealAllAndGet(userId: bigint): Promise<TicketPrize[]> {
		return this.prisma.$transaction(async (tx) => {
			const records = await tx.ticketPrize.findMany({
				where: { userId, revealed: false },
				orderBy: { ticketNumber: 'asc' },
				include: { cardDefinition: true },
			})

			if (records.length === 0) return []

			await tx.ticketPrize.updateMany({
				where: { userId, revealed: false },
				data: { revealed: true },
			})

			return records.map(toDomainTicketPrize)
		})
	}

	async getStakeCardCollections(
		userId: bigint,
		stakeId: number,
	): Promise<CardCollection[]> {
		const cardDefinitions = await this.prisma.cardDefinition.findMany({
			where: { stakeId },
			include: {
				userCards: { where: { userId } },
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

	async getHighestRoundId(): Promise<number | null> {
		const result = await this.prisma.ticketPrize.findFirst({
			orderBy: { roundId: 'desc' },
			select: { roundId: true },
		})

		return result?.roundId ?? null
	}

	async saveManyForRound(
		entries: { userId: bigint; prizes: TicketPrize[] }[],
	): Promise<void> {
		await this.prisma.$transaction(
			entries.flatMap(({ userId, prizes }) =>
				prizes.map((prize) =>
					this.prisma.ticketPrize.create({
						data: {
							userId,
							roundId: prize.roundId,
							ticketNumber: prize.ticketNumber,
							prizeAmount: prize.prizeAmount,
							cardDefinitionId: BigInt(prize.card.id),
						},
					}),
				),
			),
		)
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
	roundId: number
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
	cardDefinition: { id: bigint; tier: number; name: string; imageUrl: string }
}): TicketPrize {
	return {
		roundId: record.roundId,
		ticketNumber: record.ticketNumber,
		prizeAmount: record.prizeAmount,
		revealed: record.revealed,
		card: toCard(record.cardDefinition),
	}
}
