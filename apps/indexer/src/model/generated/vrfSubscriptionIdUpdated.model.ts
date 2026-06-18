import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class VrfSubscriptionIdUpdated {
    constructor(props?: Partial<VrfSubscriptionIdUpdated>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: false})
    subscriptionId!: bigint

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
