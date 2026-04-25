import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ReferrerRewardState {
    constructor(props?: Partial<ReferrerRewardState>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    referrer!: string

    @StringColumn_({nullable: false})
    currency!: string

    @BigIntColumn_({nullable: false})
    accrued!: bigint

    @BigIntColumn_({nullable: false})
    withdrawn!: bigint

    @BigIntColumn_({nullable: false})
    seized!: bigint
}
