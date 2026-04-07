import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Config} from "./config.model"
import {Stake} from "./stake.model"
import {RoundStatus} from "./_roundStatus"
import {VrfRequestStatus} from "./_vrfRequestStatus"
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
    @ManyToOne_(() => Config, {nullable: true})
    config!: Config

    @Index_()
    @ManyToOne_(() => Stake, {nullable: true})
    stake!: Stake

    @DateTimeColumn_({nullable: false})
    startTime!: Date

    @BigIntColumn_({nullable: false})
    ticketsSold!: bigint

    @BigIntColumn_({nullable: false})
    ticketsClaimed!: bigint

    @BigIntColumn_({nullable: false})
    ticketsRefunded!: bigint

    @Column_("varchar", {length: 13, nullable: false})
    status!: RoundStatus

    @Column_("varchar", {length: 13, nullable: false})
    vrfRequestStatus!: VrfRequestStatus

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
