import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {StakeConfig} from "./stakeConfig.model"
import {RoundStatus} from "./_roundStatus"
import {TicketPurchase} from "./ticketPurchase.model"
import {PrizeClaim} from "./prizeClaim.model"
import {Refund} from "./refund.model"

@Entity_()
export class Round {
    constructor(props?: Partial<Round>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => StakeConfig, {nullable: true})
    stakeConfig!: StakeConfig

    @DateTimeColumn_({nullable: false})
    startTime!: Date

    @IntColumn_({nullable: false})
    ticketsSold!: number

    @Column_("varchar", {length: 12, nullable: false})
    status!: RoundStatus

    @BigIntColumn_({nullable: true})
    randomA!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    randomB!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    vrfRequestId!: bigint | undefined | null

    @OneToMany_(() => TicketPurchase, e => e.round)
    ticketPurchases!: TicketPurchase[]

    @OneToMany_(() => PrizeClaim, e => e.round)
    prizesClaimed!: PrizeClaim[]

    @OneToMany_(() => Refund, e => e.round)
    refunds!: Refund[]
}
