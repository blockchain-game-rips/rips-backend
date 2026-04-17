export const vrfCoordinatorAbi = [
	{
		type: 'function',
		name: 'fulfillRandomWords',
		inputs: [
			{ name: '_requestId', type: 'uint256' },
			{ name: '_consumer', type: 'address' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const
