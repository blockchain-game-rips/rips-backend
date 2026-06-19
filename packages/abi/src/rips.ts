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
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'DEFAULT_ADMIN_ROLE',
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
		name: 'FEE_BASE',
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
		name: 'MAX_ENTRIES_PER_RANGE',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'MAX_REFERRAL_TIER_COUNT',
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
		name: 'MAX_TIER_COUNT',
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
		name: 'OPERATOR_ROLE',
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
		name: 'REFERRAL_PERIOD',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint40',
				internalType: 'uint40',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'VRF_COORDINATOR_ROLE',
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
		name: 'callbackGasLimit',
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
		name: 'claimPayout',
		inputs: [
			{
				name: 'ripId',
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
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'configIdToConfig',
		inputs: [
			{
				name: 'configId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		outputs: [
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'entryCap',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'duration',
				type: 'uint32',
				internalType: 'uint32',
			},
			{
				name: 'entryPrice',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'feePercent',
				type: 'uint16',
				internalType: 'uint16',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'configIdToTierBoundaries',
		inputs: [
			{
				name: 'configId',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'boundaries',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'createPreset',
		inputs: [
			{
				name: 'config',
				type: 'tuple',
				internalType: 'struct IRips.Config',
				components: [
					{
						name: 'tiers',
						type: 'tuple[]',
						internalType: 'struct IRips.PayoutTier[]',
						components: [
							{
								name: 'payoutCount',
								type: 'uint64',
								internalType: 'uint64',
							},
							{
								name: 'minPayout',
								type: 'uint128',
								internalType: 'uint128',
							},
							{
								name: 'maxPayout',
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
						name: 'entryCap',
						type: 'uint64',
						internalType: 'uint64',
					},
					{
						name: 'duration',
						type: 'uint32',
						internalType: 'uint32',
					},
					{
						name: 'entryPrice',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'feePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
				],
			},
		],
		outputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'defaultReferralFee',
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
		name: 'deletePreset',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
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
		name: 'getReferralTiers',
		inputs: [
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'tuple[]',
				internalType: 'struct IRips.ReferralTier[]',
				components: [
					{
						name: 'minVolume',
						type: 'uint128',
						internalType: 'uint128',
					},
					{
						name: 'feePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
				],
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getRoleAdmin',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
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
		name: 'getUserEntries',
		inputs: [
			{
				name: 'ripId',
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
				internalType: 'struct IRips.EntryRange[]',
				components: [
					{
						name: 'start',
						type: 'uint64',
						internalType: 'uint64',
					},
					{
						name: 'count',
						type: 'uint64',
						internalType: 'uint64',
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
		name: 'grantRole',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				internalType: 'bytes32',
			},
			{
				name: 'account',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'hasRefunded',
		inputs: [
			{
				name: 'ripId',
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
				name: 'refunded',
				type: 'bool',
				internalType: 'bool',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'hasRole',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				internalType: 'bytes32',
			},
			{
				name: 'account',
				type: 'address',
				internalType: 'address',
			},
		],
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
		name: 'isPresetDeleted',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		outputs: [
			{
				name: 'deleted',
				type: 'bool',
				internalType: 'bool',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'isReferrerFrozen',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'frozen',
				type: 'bool',
				internalType: 'bool',
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
		name: 'presetIdToCurrentConfigId',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		outputs: [
			{
				name: 'configId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'presetIdToCurrentRipId',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		outputs: [
			{
				name: 'ripId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'protocolFeeAccrued',
		inputs: [
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'amount',
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
		name: 'referrerCustomFee',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'customFeePercent',
				type: 'uint16',
				internalType: 'uint16',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'referrerFeeAccrued',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'amount',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'referrerToReferrerState',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'activeFeePercent',
				type: 'uint16',
				internalType: 'uint16',
			},
			{
				name: 'periodStartTimestamp',
				type: 'uint40',
				internalType: 'uint40',
			},
			{
				name: 'periodVolume',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'refund',
		inputs: [
			{
				name: 'ripId',
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
		name: 'renounceRole',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				internalType: 'bytes32',
			},
			{
				name: 'callerConfirmation',
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
				name: 'ripId',
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
		name: 'revokeRole',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				internalType: 'bytes32',
			},
			{
				name: 'account',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'ripIdToRip',
		inputs: [
			{
				name: 'ripId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'configId',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'startTime',
				type: 'uint40',
				internalType: 'uint40',
			},
			{
				name: 'entriesSold',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'vrfRequestStatus',
				type: 'uint8',
				internalType: 'enum IRips.VrfRequestStatus',
			},
			{
				name: 'randomA',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'randomB',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'seizeReferrerFee',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setCoordinator',
		inputs: [
			{
				name: 'newVrfCoordinator',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setDefaultReferralFee',
		inputs: [
			{
				name: 'newDefaultReferralFee',
				type: 'uint16',
				internalType: 'uint16',
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
		name: 'setReferralTiers',
		inputs: [
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'tiers',
				type: 'tuple[]',
				internalType: 'struct IRips.ReferralTier[]',
				components: [
					{
						name: 'minVolume',
						type: 'uint128',
						internalType: 'uint128',
					},
					{
						name: 'feePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
				],
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setReferrerCustomFee',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'customFeePercent',
				type: 'uint16',
				internalType: 'uint16',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setReferrerFrozen',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'frozen',
				type: 'bool',
				internalType: 'bool',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'supportsInterface',
		inputs: [
			{
				name: 'interfaceId',
				type: 'bytes4',
				internalType: 'bytes4',
			},
		],
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
		name: 'updatePreset',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				internalType: 'uint64',
			},
			{
				name: 'config',
				type: 'tuple',
				internalType: 'struct IRips.Config',
				components: [
					{
						name: 'tiers',
						type: 'tuple[]',
						internalType: 'struct IRips.PayoutTier[]',
						components: [
							{
								name: 'payoutCount',
								type: 'uint64',
								internalType: 'uint64',
							},
							{
								name: 'minPayout',
								type: 'uint128',
								internalType: 'uint128',
							},
							{
								name: 'maxPayout',
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
						name: 'entryCap',
						type: 'uint64',
						internalType: 'uint64',
					},
					{
						name: 'duration',
						type: 'uint32',
						internalType: 'uint32',
					},
					{
						name: 'entryPrice',
						type: 'uint256',
						internalType: 'uint256',
					},
					{
						name: 'feePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
				],
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'updateVrfKeyHash',
		inputs: [
			{
				name: 'newKeyHash',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'updateVrfRequestConfirmations',
		inputs: [
			{
				name: 'newConfirmations',
				type: 'uint16',
				internalType: 'uint16',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'updateVrfSubscriptionId',
		inputs: [
			{
				name: 'newSubscriptionId',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'userEntryCount',
		inputs: [
			{
				name: 'ripId',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'buyer',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'entryCount',
				type: 'uint64',
				internalType: 'uint64',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'vrfCoordinator',
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
		name: 'vrfRequestConfirmations',
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
		type: 'function',
		name: 'withdrawProtocolFee',
		inputs: [
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'withdrawReferrerFee',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'currency',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [],
		stateMutability: 'nonpayable',
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
		name: 'DefaultReferralFeeUpdated',
		inputs: [
			{
				name: 'newDefaultReferralFee',
				type: 'uint16',
				indexed: false,
				internalType: 'uint16',
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
		name: 'PayoutClaimed',
		inputs: [
			{
				name: 'ripId',
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
				name: 'referrer',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
			{
				name: 'entryCount',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
			{
				name: 'payoutAmount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'PresetCreated',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				indexed: true,
				internalType: 'uint64',
			},
			{
				name: 'configId',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'PresetDeleted',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				indexed: true,
				internalType: 'uint64',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'PresetUpdated',
		inputs: [
			{
				name: 'presetId',
				type: 'uint64',
				indexed: true,
				internalType: 'uint64',
			},
			{
				name: 'configId',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'ProtocolFeeAccrued',
		inputs: [
			{
				name: 'ripId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
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
		type: 'event',
		name: 'ProtocolFeeWithdrawn',
		inputs: [
			{
				name: 'recipient',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'currency',
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
		type: 'event',
		name: 'RandomnessFulfilled',
		inputs: [
			{
				name: 'ripId',
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
		name: 'RandomnessRequested',
		inputs: [
			{
				name: 'ripId',
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
		name: 'ReferralFeeAccrued',
		inputs: [
			{
				name: 'ripId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'referrer',
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
		type: 'event',
		name: 'ReferralStateUpdated',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'currency',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'referrerState',
				type: 'tuple',
				indexed: false,
				internalType: 'struct IRips.ReferrerState',
				components: [
					{
						name: 'activeFeePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
					{
						name: 'periodStartTimestamp',
						type: 'uint40',
						internalType: 'uint40',
					},
					{
						name: 'periodVolume',
						type: 'uint256',
						internalType: 'uint256',
					},
				],
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'ReferralTiersUpdated',
		inputs: [
			{
				name: 'currency',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'tiers',
				type: 'tuple[]',
				indexed: false,
				internalType: 'struct IRips.ReferralTier[]',
				components: [
					{
						name: 'minVolume',
						type: 'uint128',
						internalType: 'uint128',
					},
					{
						name: 'feePercent',
						type: 'uint16',
						internalType: 'uint16',
					},
				],
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'ReferrerCustomFeeUpdated',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'customFeePercent',
				type: 'uint16',
				indexed: false,
				internalType: 'uint16',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'ReferrerFeeSeized',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'currency',
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
		type: 'event',
		name: 'ReferrerFeeWithdrawn',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'currency',
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
		type: 'event',
		name: 'ReferrerFreezeUpdated',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'frozen',
				type: 'bool',
				indexed: false,
				internalType: 'bool',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RefundIssued',
		inputs: [
			{
				name: 'ripId',
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
				name: 'entryCount',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RipCreated',
		inputs: [
			{
				name: 'ripId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256',
			},
			{
				name: 'presetId',
				type: 'uint64',
				indexed: true,
				internalType: 'uint64',
			},
			{
				name: 'configId',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RipEntered',
		inputs: [
			{
				name: 'ripId',
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
				name: 'entryCount',
				type: 'uint64',
				indexed: false,
				internalType: 'uint64',
			},
			{
				name: 'startEntryIndex',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RoleAdminChanged',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32',
			},
			{
				name: 'previousAdminRole',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32',
			},
			{
				name: 'newAdminRole',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RoleGranted',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32',
			},
			{
				name: 'account',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'sender',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'RoleRevoked',
		inputs: [
			{
				name: 'role',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32',
			},
			{
				name: 'account',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'sender',
				type: 'address',
				indexed: true,
				internalType: 'address',
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
		type: 'event',
		name: 'VrfKeyHashUpdated',
		inputs: [
			{
				name: 'newKeyHash',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'VrfRequestConfirmationsUpdated',
		inputs: [
			{
				name: 'newConfirmations',
				type: 'uint16',
				indexed: false,
				internalType: 'uint16',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'VrfSubscriptionIdUpdated',
		inputs: [
			{
				name: 'newSubscriptionId',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
	{
		type: 'error',
		name: 'AccessControlBadConfirmation',
		inputs: [],
	},
	{
		type: 'error',
		name: 'AccessControlUnauthorizedAccount',
		inputs: [
			{
				name: 'account',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'neededRole',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
	},
	{
		type: 'error',
		name: 'AlreadyRefunded',
		inputs: [],
	},
	{
		type: 'error',
		name: 'EnforcedPause',
		inputs: [],
	},
	{
		type: 'error',
		name: 'EntryCapNotPowerOfTwo',
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
		name: 'IncorrectPayment',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidPayoutRange',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidRequestId',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidStartIndex',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidTierCount',
		inputs: [],
	},
	{
		type: 'error',
		name: 'InvalidVrfRequestStatus',
		inputs: [],
	},
	{
		type: 'error',
		name: 'NoEntriesToRefund',
		inputs: [],
	},
	{
		type: 'error',
		name: 'NotRecipientOrOwner',
		inputs: [],
	},
	{
		type: 'error',
		name: 'NothingToWithdraw',
		inputs: [],
	},
	{
		type: 'error',
		name: 'PayoutCountMismatch',
		inputs: [],
	},
	{
		type: 'error',
		name: 'PayoutPoolMismatch',
		inputs: [],
	},
	{
		type: 'error',
		name: 'PresetNotExist',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReentrancyGuardReentrantCall',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReferralTierCountExceeded',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReferralTiersEmpty',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReferralTiersNotSorted',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ReferrerFrozen',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RipExpired',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RipNotExist',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RipNotExpired',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RipNotFulfilled',
		inputs: [],
	},
	{
		type: 'error',
		name: 'RipNotSoldOut',
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
		name: 'TiersNotSortedByPayoutCount',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TransferFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'VrfAlreadyRequested',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ZeroAddress',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ZeroEntries',
		inputs: [],
	},
	{
		type: 'error',
		name: 'ZeroSubscriptionId',
		inputs: [],
	},
] as const
