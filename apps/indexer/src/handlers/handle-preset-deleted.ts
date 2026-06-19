import * as rips from '../abi/rips'
import { resolvePresetOrThrow } from '../helpers'
import { HandlerArgs } from '../types'

export async function handlePresetDeleted(args: HandlerArgs): Promise<void> {
	const { ctx, entities, log } = args

	const { presetId } = rips.events.PresetDeleted.decode(log)
	const presetIdStr = presetId.toString()

	const preset = await resolvePresetOrThrow(
		ctx,
		entities.presets,
		presetIdStr,
	)

	preset.deleted = true
	entities.presets.set(presetIdStr, preset)
}
