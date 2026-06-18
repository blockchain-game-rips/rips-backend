import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ReferrerFreezeUpdated {
    constructor(props?: Partial<ReferrerFreezeUpdated>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    referrer!: string

    @BooleanColumn_({nullable: false})
    frozen!: boolean

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
