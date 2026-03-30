export const ripsAbi = [
	{
		type: 'constructor',
		inputs: [
			{
				name: 'vrfCoordinator',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'vrfSubscriptionId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'vrfKeyHash',
				type: 'bytes32',
				internalType: 'bytes32',
			},
			{
				name: 'callbackGasLimit',
				type: 'uint32',
				internalType: 'uint32',
			},
			{
				name: 'initialFeePercent',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'MAX_TICKETS_PER_RANGE',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'VRF_NUM_WORDS',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint32',
				internalType: 'uint32',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'VRF_REQUEST_CONFIRMATIONS',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint16',
				internalType: 'uint16',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'acceptOwnership',
		inputs: [],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'buyTickets',
		inputs: [
			{
				name: 'stakeId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'ticketCount',
				type: 'uint256',
				internalType: 'uint256',
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
		name: 'claimPrizes',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'startIndex',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'maxRanges',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'createStake',
		inputs: [
			{
				name: 'config',
				type: 'tuple',
				internalType: 'struct IRips.StakeConfig',
				components: [
					{
						name: 'prizeDistribution',
						type: 'tuple[]',
						internalType: 'struct IRips.PrizeTier[]',
						components: [
							{
								name: 'prizeCount',
								type: 'uint64',
								internalType: 'uint64',
							},
							{
								name: 'minPrize',
								type: 'uint128',
								internalType: 'uint128',
							},
							{
								name: 'maxPrize',
								type: 'uint128',
								internalType: 'uint128',
							},
						],
					},
					{
						name: 'currency',
						type: 'address',
						internalType: 'address',
					},
					{
						name: 'ticketCap',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'duration',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'ticketCost',
						type: 'uint256',
						internalType: 'uint256',
					},
				],
			},
		],
		outputs: [
			{
				name: 'stakeId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'deleteStake',
		inputs: [
			{
				name: 'stakeId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'feeRecipient',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getUserTickets',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'user',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'tuple[]',
				internalType: 'struct IRips.TicketRange[]',
				components: [
					{
						name: 'start',
						type: 'uint96',
						internalType: 'uint96',
					},
					{
						name: 'count',
						type: 'uint96',
						internalType: 'uint96',
					},
					{
						name: 'claimed',
						type: 'bool',
						internalType: 'bool',
					},
				],
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'pause',
		inputs: [],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'paused',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'bool',
				internalType: 'bool',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'protocolFeePercent',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'rawFulfillRandomWords',
		inputs: [
			{
				name: 'requestId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'randomWords',
				type: 'uint256[]',
				internalType: 'uint256[]',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'refund',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'requestRandomness',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'requestId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 's_vrfCoordinator',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IVRFCoordinatorV2Plus',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'setCoordinator',
		inputs: [
			{
				name: '_vrfCoordinator',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setFeeRecipient',
		inputs: [
			{
				name: 'newRecipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setProtocolFee',
		inputs: [
			{
				name: 'newFeePercent',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'transferOwnership',
		inputs: [
			{
				name: 'to',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'unpause',
		inputs: [],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'updateCallbackGasLimit',
		inputs: [
			{
				name: 'newLimit',
				type: 'uint32',
				internalType: 'uint32',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'vrfKeyHash',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'vrfSubscriptionId',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'CallbackGasLimitUpdated',
		inputs: [
			{
				name: 'newLimit',
				type: 'uint32',
				indexed: false,
				internalType: 'uint32',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'CoordinatorSet',
		inputs: [
			{
				name: 'vrfCoordinator',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'FeeRecipientUpdated',
		inputs: [
			{
				name: 'newRecipient',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'OwnershipTransferRequested',
		inputs: [
			{
				name: 'from',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'to',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'OwnershipTransferred',
		inputs: [
			{
				name: 'from',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'to',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'Paused',
		inputs: [
			{
				name: 'account',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'PrizesClaimed',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'ticketCount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'prizeAmount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'ProtocolFeeUpdated',
		inputs: [
			{
				name: 'newFeePercent',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RandomnessRequested',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'vrfRequestId',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RefundIssued',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'ticketCount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RoundCreated',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'stakeId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RoundFinalized',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'randomA',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'randomB',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'StakeCreated',
		inputs: [
			{
				name: 'stakeId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'StakeDeleted',
		inputs: [
			{
				name: 'stakeId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'TicketsPurchased',
		inputs: [
			{
				name: 'roundId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'ticketCount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'startTicketIndex',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'Unpaused',
		inputs: [
			{
				name: 'account',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'error',
		name: 'AlreadyRefunded',
		inputs: [],
	},
	{
		type: 'error',
		name: 'EmptyPrizeDistribution',
		inputs: [],
	},
	{
		type: 'error',
		name: 'EnforcedPause',
		inputs: [],
	},
	{
		type: 'error',
		name: 'EthSentForERC20',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ExpectedPause',
		inputs: [],
	},
	{
		type: 'error',
		name: 'FeeTooHigh',
		inputs: [],
	},
	{
		type: 'error',
		name: 'FeeTransferFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'IncorrectPayment',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidPrizeRange',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidStartIndex',
		inputs: [],
	},
	{
		type: 'error',
		name: 'NativePaymentRequired',
		inputs: [],
	},
	{
		type: 'error',
		name: 'NoTicketsToRefund',
		inputs: [],
	},
	{
		type: 'error',
		name: 'OnlyCoordinatorCanFulfill',
		inputs: [
			{
				name: 'have',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'want',
				type: 'address',
				internalType: 'address',
			},
		],
	},
	{
		type: 'error',
		name: 'OnlyOwnerOrCoordinator',
		inputs: [
			{
				name: 'have',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'owner',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'coordinator',
				type: 'address',
				internalType: 'address',
			},
		],
	},
	{
		type: 'error',
		name: 'PrizeCountMismatch',
		inputs: [],
	},
	{
		type: 'error',
		name: 'PrizePoolMismatch',
		inputs: [],
	},
	{
		type: 'error',
		name: 'PrizeTransferFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReentrancyGuardReentrantCall',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RefundFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReturnExcessFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RoundNotExist',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RoundNotExpired',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RoundNotFinalized',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RoundNotSoldOut',
		inputs: [],
	},
	{
		type: 'error',
		name: 'SafeERC20FailedOperation',
		inputs: [
			{
				name: 'token',
				type: 'address',
				internalType: 'address',
			},
		],
	},
	{
		type: 'error',
		name: 'StakeNotExist',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TicketCapNotPowerOfTwo',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ZeroAddress',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ZeroTickets',
		inputs: [],
	},
] as const
