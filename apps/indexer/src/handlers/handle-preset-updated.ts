import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import { buildPayoutTiers, resolvePresetOrThrow } from '../helpers'
import { Config } from '../model'
import { Log } from '../processor'
import { HandlerArgs } from '../types'

export async function handlePresetUpdated(args: HandlerArgs): Promise<void> {
	const { ctx, entities, log } = args

	const { presetId, configId } = rips.events.PresetUpdated.decode(log)
	const presetIdStr = presetId.toString()
	const configIdStr = configId.toString()

	const txConfig = decodeInputOrThrow(log)

	const preset = await resolvePresetOrThrow(
		ctx,
		entities.presets,
		presetIdStr,
	)

	const config = new Config({
		id: configIdStr,
		preset,
		entryCap: txConfig.entryCap,
		currency: txConfig.currency.toLowerCase(),
		durationSeconds: BigInt(txConfig.duration),
		entryPrice: txConfig.entryPrice,
		feeBps: BigInt(txConfig.feeBps),
	})

	entities.configs.set(configIdStr, config)
	entities.payoutTiers.push(...buildPayoutTiers(config, txConfig.tiers))
}

function decodeInputOrThrow(log: Log) {
	try {
		return rips.functions.updatePreset.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode updatePreset with input ${log.transaction?.input}`,
		)
	}
}
