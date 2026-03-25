import { readFileSync } from 'fs'
import * as yaml from 'js-yaml'
import {
	CHAIN_CLIENT_CONFIG_KEY,
	ChainClientConfigSchema,
} from 'src/infrastructure/evm/evm-client/configuration/chain-client-config'
import { getEnvSafe } from 'src/utils/common'
import { parsePretty } from 'src/utils/zod'
import z from 'zod'

export const ConfigSchema = z.object({
	[CHAIN_CLIENT_CONFIG_KEY]: ChainClientConfigSchema,
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
