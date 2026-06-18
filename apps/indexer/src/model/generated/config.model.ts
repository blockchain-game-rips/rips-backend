import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_, StringColumn as StringColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Stake} from "./stake.model"
import {PrizeTier} from "./prizeTier.model"
import {Round} from "./round.model"

@Entity_()
export class Config {
    constructor(props?: Partial<Config>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Stake, {nullable: true})
    stake!: Stake

    @BigIntColumn_({nullable: false})
    ticketCap!: bigint

    @StringColumn_({nullable: false})
    currency!: string

    @BigIntColumn_({nullable: false})
    durationSeconds!: bigint

    @BigIntColumn_({nullable: false})
    ticketCost!: bigint

    @BigIntColumn_({nullable: false})
    feePercent!: bigint

    @OneToMany_(() => PrizeTier, e => e.config)
    prizeDistribution!: PrizeTier[]

    @OneToMany_(() => Round, e => e.config)
    rounds!: Round[]
}
