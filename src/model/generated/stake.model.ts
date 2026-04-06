import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BooleanColumn as BooleanColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Config} from "./config.model"

@Entity_()
export class Stake {
    constructor(props?: Partial<Stake>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BooleanColumn_({nullable: false})
    deleted!: boolean

    @OneToMany_(() => Config, e => e.stake)
    configs!: Config[]
}
