import {
	BigIntColumn as BigIntColumn_,
	DateTimeColumn as DateTimeColumn_,
	Entity as Entity_,
	PrimaryColumn as PrimaryColumn_,
	StringColumn as StringColumn_,
} from '@subsquid/typeorm-store'

@Entity_()
export class ProtocolFeeUpdated {
	constructor(props?: Partial<ProtocolFeeUpdated>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@BigIntColumn_({ nullable: false })
	feePercent!: bigint

	@BigIntColumn_({ nullable: false })
	blockNumber!: bigint

	@DateTimeColumn_({ nullable: false })
	timestamp!: Date

	@StringColumn_({ nullable: false })
	txHash!: string
}
