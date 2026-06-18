export const fulfilledOrderAbi = [
	{
		anonymous: false,
		inputs: [
			{
				components: [
					{
						internalType: 'uint64',
						name: 'makerOrderNonce',
						type: 'uint64',
					},
					{ internalType: 'bytes', name: 'makerSrc', type: 'bytes' },
					{
						internalType: 'uint256',
						name: 'giveChainId',
						type: 'uint256',
					},
					{
						internalType: 'bytes',
						name: 'giveTokenAddress',
						type: 'bytes',
					},
					{
						internalType: 'uint256',
						name: 'giveAmount',
						type: 'uint256',
					},
					{
						internalType: 'uint256',
						name: 'takeChainId',
						type: 'uint256',
					},
					{
						internalType: 'bytes',
						name: 'takeTokenAddress',
						type: 'bytes',
					},
					{
						internalType: 'uint256',
						name: 'takeAmount',
						type: 'uint256',
					},
					{
						internalType: 'bytes',
						name: 'receiverDst',
						type: 'bytes',
					},
					{
						internalType: 'bytes',
						name: 'givePatchAuthoritySrc',
						type: 'bytes',
					},
					{
						internalType: 'bytes',
						name: 'orderAuthorityAddressDst',
						type: 'bytes',
					},
					{
						internalType: 'bytes',
						name: 'allowedTakerDst',
						type: 'bytes',
					},
					{
						internalType: 'bytes',
						name: 'allowedCancelBeneficiarySrc',
						type: 'bytes',
					},
					{
						internalType: 'bytes',
						name: 'externalCall',
						type: 'bytes',
					},
				],
				indexed: false,
				internalType: 'struct DlnOrderLib.Order',
				name: 'order',
				type: 'tuple',
			},
			{
				indexed: false,
				internalType: 'bytes32',
				name: 'orderId',
				type: 'bytes32',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'actualFulfillAmount',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'address',
				name: 'sender',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'address',
				name: 'unlockAuthority',
				type: 'address',
			},
		],
		name: 'FulfilledOrder',
		type: 'event',
	},
] as const
