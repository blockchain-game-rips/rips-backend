import { Config } from './config'

export type Preset = {
	id: number
	/** A new rip is created based on this config. If null, no rip can be created — the preset has been deleted. */
	currentConfig: Config | null
}
