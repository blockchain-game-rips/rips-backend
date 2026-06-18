import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {ReferralTiersUpdated} from "./referralTiersUpdated.model"

@Entity_()
export class ReferralTier {
    constructor(props?: Partial<ReferralTier>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => ReferralTiersUpdated, {nullable: true})
    update!: ReferralTiersUpdated

    @BigIntColumn_({nullable: false})
    minVolume!: bigint

    @IntColumn_({nullable: false})
    feePercent!: number
}
