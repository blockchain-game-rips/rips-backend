import {
	BigIntColumn as BigIntColumn_,
	Column as Column_,
	Entity as Entity_,
	Index as Index_,
	IntColumn as IntColumn_,
	ManyToOne as ManyToOne_,
	OneToMany as OneToMany_,
	PrimaryColumn as PrimaryColumn_,
} from '@subsquid/typeorm-store'
import { RoundStatus } from './_roundStatus'
import { PrizeClaim } from './prizeClaim.model'
import { Refund } from './refund.model'
import { StakeConfig } from './stakeConfig.model'
import { TicketPurchase } from './ticketPurchase.model'

@Entity_()
export class Round {
	constructor(props?: Partial<Round>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@Index_()
	@ManyToOne_(() => StakeConfig, { nullable: true })
	stakeConfig!: StakeConfig

	@BigIntColumn_({ nullable: false })
	startTime!: bigint

	@IntColumn_({ nullable: false })
	ticketsSold!: number

	@Column_('varchar', { length: 12, nullable: false })
	status!: RoundStatus

	@BigIntColumn_({ nullable: true })
	randomA!: bigint | undefined | null

	@BigIntColumn_({ nullable: true })
	randomB!: bigint | undefined | null

	@BigIntColumn_({ nullable: true })
	vrfRequestId!: bigint | undefined | null

	@OneToMany_(() => TicketPurchase, (e) => e.round)
	ticketPurchases!: TicketPurchase[]

	@OneToMany_(() => PrizeClaim, (e) => e.round)
	prizesClaimed!: PrizeClaim[]

	@OneToMany_(() => Refund, (e) => e.round)
	refunds!: Refund[]
}
