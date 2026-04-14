import { readFileSync } from 'fs'
import * as yaml from 'js-yaml'
import z from 'zod'
import {
	CHAIN_CLIENT_CONFIG_KEY,
	ChainClientConfigSchema,
} from '../infrastructure/evm/evm-client/configuration/chain-client-config'
import { getEnvSafe } from '../utils/common'
import { parsePretty } from '../utils/zod'

export const CARD_CONFIG_KEY = 'cardConfig'

export const CardConfigSchema = z.object({
	// stakeId (as string key in yaml) → array of biases, one per prize tier
	stakesBiases: z.record(z.string(), z.array(z.number())),
})

export type CardConfig = z.infer<typeof CardConfigSchema>

export const ConfigSchema = z.object({
	[CHAIN_CLIENT_CONFIG_KEY]: ChainClientConfigSchema,
	[CARD_CONFIG_KEY]: CardConfigSchema,
})

export function loadConfig() {
	const YAML_CONFIG_FILENAME = getEnvSafe('CONFIG_PATH')

	const config = yaml.load(readFileSync(YAML_CONFIG_FILENAME, 'utf8'))

	if (!config) {
		throw new Error(
			'Config is not found with path: ' + YAML_CONFIG_FILENAME,
		)
	}

	const parsedConfig = parsePretty(ConfigSchema, config)

	return parsedConfig
}
