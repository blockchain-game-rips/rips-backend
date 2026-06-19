import { Config } from '../entities/config'
import { Preset } from '../entities/preset'
import { OngoingRip } from '../entities/rip'

export type AvailablePreset =
	| { preset: Preset & { currentConfig: Config }; fillingRip: null }
	| { preset: Preset; fillingRip: OngoingRip }
