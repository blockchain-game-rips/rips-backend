import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import { buildPayoutTiers } from '../helpers'
import { Config, Preset } from '../model'
import { Log } from '../processor'
import { HandlerArgs } from '../types'

export function handlePresetCreated(args: HandlerArgs): void {
	const { entities, log } = args

	const { presetId, configId } = rips.events.PresetCreated.decode(log)
	const presetIdStr = presetId.toString()
	const configIdStr = configId.toString()

	const txConfig = decodeInputOrThrow(log)

	const preset = new Preset({ id: presetIdStr, deleted: false })
	entities.presets.set(presetIdStr, preset)

	const config = new Config({
		id: configIdStr,
		preset,
		entryCap: txConfig.entryCap,
		currency: txConfig.currency.toLowerCase(),
		durationSeconds: BigInt(txConfig.duration),
		entryPrice: txConfig.entryPrice,
		feePercent: BigInt(txConfig.feePercent),
	})

	entities.configs.set(configIdStr, config)
	entities.payoutTiers.push(...buildPayoutTiers(config, txConfig.tiers))
}

function decodeInputOrThrow(log: Log) {
	try {
		return rips.functions.createPreset.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode createPreset with input ${log.transaction?.input}`,
		)
	}
}
