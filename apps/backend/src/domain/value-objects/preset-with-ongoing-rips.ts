import { Preset } from '../entities/preset'
import { OngoingRip } from '../entities/rip'

export type PresetWithOngoingRips = {
	preset: Preset
	ongoingRips: OngoingRip[]
}
