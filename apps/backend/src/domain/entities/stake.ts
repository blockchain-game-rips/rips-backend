import { Config } from './config'

export type Stake = {
	id: number
	/** A new round is created based on this config. If null, no round can be created — the stake has been deleted. */
	currentConfig: Config | null
}
