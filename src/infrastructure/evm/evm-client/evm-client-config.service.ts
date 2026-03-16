import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Chain, defineChain } from 'viem'
import { z } from 'zod'
import { getAlchemyRpcUrl } from './alchemy/alchemy-utils'
import { CHAIN_CLIENT_CONFIG_KEY } from './configuration/chain-client-config'
import { ChainClientConfig, CustomChain, RpcSettings, RpcUrl } from './types'

@Injectable()
export class EvmClientConfigService {
	rpcSettings?: Record<
		number,
		| {
				rpcUrls: RpcUrl[]
				disableDefaultRpcUrl: boolean
				batchSize?: number
		  }
		| undefined
	>
	customChains?: Chain[]

	constructor(private readonly configService: ConfigService) {
		const config = this.configService.get<ChainClientConfig>(
			CHAIN_CLIENT_CONFIG_KEY,
		)

		if (config?.rpcSettings)
			this.rpcSettings = this.transformRpcProviders(config?.rpcSettings)

		if (config?.customChains)
			this.customChains = this.transformCustomChains(config?.customChains)
	}

	private transformRpcProviders(rpcProviders: RpcSettings) {
		const rpcUrls: Record<
			number,
			{ rpcUrls: RpcUrl[]; disableDefaultRpcUrl: boolean }
		> = {}

		for (const [chainId, urls] of Object.entries(rpcProviders)) {
			rpcUrls[Number(chainId)] = {
				rpcUrls: [],
				disableDefaultRpcUrl: false,
			}

			urls.rpcUrls.forEach((initialUrl) => {
				let rpcUrl = initialUrl

				if (initialUrl === 'alchemy') {
					rpcUrl = getAlchemyRpcUrl(Number(chainId))
				}

				const validatedUrl = z.url().parse(rpcUrl)

				rpcUrls[Number(chainId)].rpcUrls.push(validatedUrl as RpcUrl)
			})

			rpcUrls[Number(chainId)].disableDefaultRpcUrl =
				urls.disableDefaultRpcUrl
		}

		return rpcUrls
	}

	private transformCustomChains(customChains: CustomChain[]): Chain[] {
		return customChains.map((customChain) =>
			defineChain({
				id: customChain.chainId,
				rpcUrls: { default: { http: [customChain.defaultRpcUrl] } },
				name: customChain.chainName,
				nativeCurrency: customChain.nativeCurrency,
			}),
		)
	}
}
