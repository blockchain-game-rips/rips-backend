export const ripsConduitAbi = [
	{
		type: 'constructor',
		inputs: [
			{
				name: 'ripsAddress',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'receive',
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'enterRip',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'entryCount',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'rips',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IRips',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'ExcessForwarded',
		inputs: [
			{
				name: 'recipient',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'error',
		name: 'NotRips',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TransferFailed',
		inputs: [],
	},
] as const
