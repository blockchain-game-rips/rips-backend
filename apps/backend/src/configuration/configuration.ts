import { readFileSync } from 'fs'
import * as yaml from 'js-yaml'
import z from 'zod'
import {
	CHAIN_CLIENT_CONFIG_KEY,
	ChainClientConfigSchema,
} from '../infrastructure/evm/evm-client/configuration/chain-client-config'
import { getEnvSafe } from '../utils/common'
import { parsePretty } from '../utils/zod'

export const USE_ALCHEMY_BALANCES_KEY = 'useAlchemyBalances'

export const DEFAULT_USE_ALCHEMY_BALANCES = true

export const SUPPORTED_CURRENCIES_KEY = 'supportedCurrencies'

const supportedCurrencySchema = z.object({
	chain: z.object({
		namespace: z.string(),
		reference: z.string(),
	}),
	address: z.string(),
})

export const SupportedCurrenciesSchema = z
	.array(supportedCurrencySchema)
	.default([])

export type SupportedCurrenciesConfig = z.infer<
	typeof SupportedCurrenciesSchema
>

export const ConfigSchema = z.object({
	[CHAIN_CLIENT_CONFIG_KEY]: ChainClientConfigSchema,
	[USE_ALCHEMY_BALANCES_KEY]: z
		.boolean()
		.default(DEFAULT_USE_ALCHEMY_BALANCES),
	[SUPPORTED_CURRENCIES_KEY]: SupportedCurrenciesSchema,
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
