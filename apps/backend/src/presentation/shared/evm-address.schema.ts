import { isAddress } from 'viem'
import { z } from 'zod'
import { toEvmAddress } from '../../domain/value-objects/evm-address'

export const evmAddressSchema = z
	.string()
	.refine(isAddress, 'Invalid EVM address')
	.transform(toEvmAddress)
