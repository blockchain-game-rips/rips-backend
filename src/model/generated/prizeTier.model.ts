import {
	BigIntColumn as BigIntColumn_,
	Entity as Entity_,
	Index as Index_,
	IntColumn as IntColumn_,
	ManyToOne as ManyToOne_,
	PrimaryColumn as PrimaryColumn_,
} from '@subsquid/typeorm-store'
import { StakeConfig } from './stakeConfig.model'

@Entity_()
export class PrizeTier {
	constructor(props?: Partial<PrizeTier>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@Index_()
	@ManyToOne_(() => StakeConfig, { nullable: true })
	stakeConfig!: StakeConfig

	@IntColumn_({ nullable: false })
	tierIndex!: number

	@BigIntColumn_({ nullable: false })
	prizeCount!: bigint

	@BigIntColumn_({ nullable: false })
	minPrize!: bigint

	@BigIntColumn_({ nullable: false })
	maxPrize!: bigint
}
