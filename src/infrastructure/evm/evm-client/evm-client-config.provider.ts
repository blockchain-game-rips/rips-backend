import { ConfigService } from '@nestjs/config'
import { Chain, defineChain } from 'viem'
import { z } from 'zod'
import { getAlchemyRpcUrl } from './alchemy/alchemy-utils'
import { CHAIN_CLIENT_CONFIG_KEY } from './configuration/chain-client-config'
import {
	ChainClientConfig,
	CustomChain,
	EVM_CLIENT_CONFIG,
	ResolvedEvmClientConfig,
	RpcSettings,
	RpcUrl,
} from './types'

function transformRpcSettings(
	rpcSettings: RpcSettings,
): ResolvedEvmClientConfig['rpcSettings'] {
	const resolved: NonNullable<ResolvedEvmClientConfig['rpcSettings']> = {}

	for (const [chainId, settings] of Object.entries(rpcSettings)) {
		const resolvedUrls = settings.rpcUrls.map((url) => {
			const rawUrl = url === 'alchemy' ? getAlchemyRpcUrl(Number(chainId)) : url
			return z.url().parse(rawUrl) as RpcUrl
		})

		resolved[Number(chainId)] = {
			rpcUrls: resolvedUrls,
			disableDefaultRpcUrl: settings.disableDefaultRpcUrl,
			batchSize: settings.batchSize,
		}
	}

	return resolved
}

function transformCustomChains(customChains: CustomChain[]): Chain[] {
	return customChains.map((customChain) =>
		defineChain({
			id: customChain.chainId,
			rpcUrls: { default: { http: [customChain.defaultRpcUrl] } },
			name: customChain.chainName,
			nativeCurrency: customChain.nativeCurrency,
		}),
	)
}

export const evmClientConfigProvider = {
	provide: EVM_CLIENT_CONFIG,
	useFactory: (configService: ConfigService): ResolvedEvmClientConfig => {
		const config =
			configService.get<ChainClientConfig>(CHAIN_CLIENT_CONFIG_KEY)

		return {
			rpcSettings: config?.rpcSettings
				? transformRpcSettings(config.rpcSettings)
				: undefined,
			customChains: config?.customChains
				? transformCustomChains(config.customChains)
				: undefined,
		}
	},
	inject: [ConfigService],
}
