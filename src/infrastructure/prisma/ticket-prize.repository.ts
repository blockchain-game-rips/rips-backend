import { Injectable } from '@nestjs/common'
import {
	TicketPrizeInput,
	TicketPrizeRepository,
} from 'src/application/interfaces/repositories/ticket-prize.repository'
import { TicketPrize } from 'src/domain/entities/ticket-prize'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaTicketPrizeRepository extends TicketPrizeRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async upsertMany(
		userId: bigint,
		prizes: TicketPrizeInput[],
	): Promise<void> {
		await this.prisma.$transaction(
			prizes.map((prize) =>
				this.prisma.ticketPrize.upsert({
					where: {
						roundId_ticketNumber: {
							roundId: prize.roundId,
							ticketNumber: prize.ticketNumber,
						},
					},
					create: { userId, ...prize },
					update: { prizeAmount: prize.prizeAmount },
				}),
			),
		)
	}

	async getUnrevealed(userId: bigint): Promise<TicketPrize[]> {
		const records = await this.prisma.ticketPrize.findMany({
			where: { userId, revealed: false },
			orderBy: { ticketNumber: 'asc' },
		})

		return records.map(toDomainTicketPrize)
	}

	async revealAndGet(userId: bigint): Promise<TicketPrize | null> {
		return this.prisma.$transaction(async (tx) => {
			const record = await tx.ticketPrize.findFirst({
				where: { userId, revealed: false },
				orderBy: { ticketNumber: 'asc' },
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
			})

			if (records.length === 0) return []

			await tx.ticketPrize.updateMany({
				where: { userId, revealed: false },
				data: { revealed: true },
			})

			return records.map(toDomainTicketPrize)
		})
	}
}

function toDomainTicketPrize(record: {
	roundId: number
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
}): TicketPrize {
	return {
		roundId: record.roundId,
		ticketNumber: record.ticketNumber,
		prizeAmount: record.prizeAmount,
		revealed: record.revealed,
	}
}
