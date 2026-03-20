import {
	BigIntColumn as BigIntColumn_,
	Entity as Entity_,
	IntColumn as IntColumn_,
	PrimaryColumn as PrimaryColumn_,
	StringColumn as StringColumn_,
} from '@subsquid/typeorm-store'

@Entity_()
export class ProtocolSettings {
	constructor(props?: Partial<ProtocolSettings>) {
		Object.assign(this, props)
	}

	@PrimaryColumn_()
	id!: string

	@BigIntColumn_({ nullable: false })
	feePercent!: bigint

	@StringColumn_({ nullable: false })
	feeRecipient!: string

	@IntColumn_({ nullable: false })
	callbackGasLimit!: number
}
