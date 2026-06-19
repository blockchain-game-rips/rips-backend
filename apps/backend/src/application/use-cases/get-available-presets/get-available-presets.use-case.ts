import { AvailablePreset } from '../../../domain/value-objects/available-preset'

export abstract class GetAvailablePresetsUseCase {
	abstract execute(): Promise<AvailablePreset[]>
}
