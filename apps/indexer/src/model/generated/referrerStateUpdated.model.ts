import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ReferrerStateUpdated {
    constructor(props?: Partial<ReferrerStateUpdated>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    referrer!: string

    @StringColumn_({nullable: false})
    currency!: string

    @IntColumn_({nullable: false})
    activeFeePercent!: number

    @DateTimeColumn_({nullable: false})
    periodStartTime!: Date

    @BigIntColumn_({nullable: false})
    periodVolume!: bigint

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
