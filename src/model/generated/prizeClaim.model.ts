import {
	BigIntColumn as BigIntColumn_,
	DateTimeColumn as DateTimeColumn_,
	Entity as Entity_,
	Index as Index_,
	ManyToOne as ManyToOne_,
	PrimaryColumn as PrimaryColumn_,
	StringColumn as StringColumn_,
} from '@subsquid/typeorm-store'
import { Round } from './round.model'

@Entity_()
export class PrizeClaim {
	constructor(props?: Partial<PrizeClaim>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@Index_()
	@ManyToOne_(() => Round, { nullable: true })
	round!: Round

	@StringColumn_({ nullable: false })
	claimer!: string

	@BigIntColumn_({ nullable: false })
	amount!: bigint

	@BigIntColumn_({ nullable: false })
	blockNumber!: bigint

	@DateTimeColumn_({ nullable: false })
	timestamp!: Date

	@StringColumn_({ nullable: false })
	txHash!: string
}
