import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ReferralStatsUpdated {
    constructor(props?: Partial<ReferralStatsUpdated>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    activeFeePercent!: number

    @IntColumn_({nullable: false})
    customFeePercent!: number

    @BigIntColumn_({nullable: false})
    monthStartTimestamp!: bigint

    @BigIntColumn_({nullable: false})
    currMonthVolume!: bigint

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
