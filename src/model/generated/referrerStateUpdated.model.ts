import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ReferrerStateUpdated {
    constructor(props?: Partial<ReferrerStateUpdated>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    referrer!: string

    @IntColumn_({nullable: false})
    activeFeePercent!: number

    @IntColumn_({nullable: false})
    customFeePercent!: number

    @BigIntColumn_({nullable: false})
    monthStartTime!: bigint

    @BigIntColumn_({nullable: false})
    currMonthVolume!: bigint

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
