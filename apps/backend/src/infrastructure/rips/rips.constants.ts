import { keccak256, toBytes } from 'viem'

export const RIPS_CONTRACT = Symbol('RIPS_CONTRACT')

export const RIPS_CONDUIT_CONTRACT = Symbol('RIPS_CONDUIT_CONTRACT')

export const OPERATOR_ROLE = keccak256(toBytes('OPERATOR_ROLE'))
