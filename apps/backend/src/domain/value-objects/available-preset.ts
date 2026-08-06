import { Config } from '../entities/config'
import { Preset } from '../entities/preset'
import { Rip, RipStatus } from '../entities/rip'

export type AvailablePreset =
	| { preset: Preset & { currentConfig: Config }; fillingRip: null }
	| { preset: Preset; fillingRip: Rip & { status: RipStatus.FILLING } }
