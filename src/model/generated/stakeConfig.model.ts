import {
	BigIntColumn as BigIntColumn_,
	BooleanColumn as BooleanColumn_,
	Entity as Entity_,
	OneToMany as OneToMany_,
	PrimaryColumn as PrimaryColumn_,
} from '@subsquid/typeorm-store'
import { PrizeTier } from './prizeTier.model'
import { Round } from './round.model'

@Entity_()
export class StakeConfig {
	constructor(props?: Partial<StakeConfig>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@BigIntColumn_({ nullable: false })
	ticketCap!: bigint

	@BigIntColumn_({ nullable: false })
	duration!: bigint

	@BigIntColumn_({ nullable: false })
	ticketCost!: bigint

	@OneToMany_(() => PrizeTier, (e) => e.stakeConfig)
	prizeDistribution!: PrizeTier[]

	@BooleanColumn_({ nullable: false })
	deleted!: boolean

	@OneToMany_(() => Round, (e) => e.stakeConfig)
	rounds!: Round[]
}
