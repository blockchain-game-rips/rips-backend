import {
	BigIntColumn as BigIntColumn_,
	DateTimeColumn as DateTimeColumn_,
	Entity as Entity_,
	PrimaryColumn as PrimaryColumn_,
	StringColumn as StringColumn_,
} from '@subsquid/typeorm-store'

@Entity_()
export class FeeRecipientUpdated {
	constructor(props?: Partial<FeeRecipientUpdated>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@StringColumn_({ nullable: false })
	feeRecipient!: string

	@BigIntColumn_({ nullable: false })
	blockNumber!: bigint

	@DateTimeColumn_({ nullable: false })
	timestamp!: Date

	@StringColumn_({ nullable: false })
	txHash!: string
}
