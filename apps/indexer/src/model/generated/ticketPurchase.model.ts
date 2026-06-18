import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"
import {Round} from "./round.model"

@Entity_()
export class TicketPurchase {
    constructor(props?: Partial<TicketPurchase>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Round, {nullable: true})
    round!: Round

    @StringColumn_({nullable: false})
    user!: string

    @BigIntColumn_({nullable: false})
    ticketCount!: bigint

    @BigIntColumn_({nullable: false})
    startTicketIndex!: bigint

    @BigIntColumn_({nullable: false})
    blockNumber!: bigint

    @DateTimeColumn_({nullable: false})
    time!: Date

    @StringColumn_({nullable: false})
    txHash!: string
}
