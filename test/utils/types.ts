export type AnvilConfig = {
	chainId: number
	fork?: {
		rpcUrl: string
		/** fork runs from this block number, default is latest */
		blockNumber?: number
	}
	/** timeout in milliseconds for starting Anvil, default is 5000 */
	timeoutStartAnvil?: number
	/** block time in seconds, default is mine block for each transaction */
	blockTime?: number
	/** port for anvil, default is random */
	port?: number
	printTraces?: boolean
}

export type ParamsUseAnvil = Omit<AnvilConfig, 'fork'> & {
	fork?: {
		/** RPC URL for forking, default is viem's default */
		rpcUrl?: string
		/** fork runs from this block number, default is latest */
		blockNumber?: number
	}
}
