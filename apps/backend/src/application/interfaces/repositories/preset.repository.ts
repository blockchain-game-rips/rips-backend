import { PresetWithOngoingRips } from '../../../domain/value-objects/preset-with-ongoing-rips'

export abstract class PresetRepository {
	abstract getPresetsWithOngoingRips(): Promise<PresetWithOngoingRips[]>
}
