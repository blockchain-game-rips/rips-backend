import {
	BigIntColumn as BigIntColumn_,
	DateTimeColumn as DateTimeColumn_,
	Entity as Entity_,
	IntColumn as IntColumn_,
	PrimaryColumn as PrimaryColumn_,
	StringColumn as StringColumn_,
} from '@subsquid/typeorm-store'

@Entity_()
export class CallbackGasLimitUpdated {
	constructor(props?: Partial<CallbackGasLimitUpdated>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@IntColumn_({ nullable: false })
	callbackGasLimit!: number

	@BigIntColumn_({ nullable: false })
	blockNumber!: bigint

	@DateTimeColumn_({ nullable: false })
	timestamp!: Date

	@StringColumn_({ nullable: false })
	txHash!: string
}
