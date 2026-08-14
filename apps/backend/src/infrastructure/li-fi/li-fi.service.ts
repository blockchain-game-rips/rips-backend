import { Inject, Injectable } from '@nestjs/common'
import {
	encodeFunctionData,
	getAddress,
	Hex,
	TransactionRequestEIP1559,
} from 'viem'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { TransactionFailedError } from '../../domain/errors/transaction-failed.error'
import {
	evmAddressFromWallet,
	evmChainIdFromCurrency,
} from '../../domain/services/evm'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	SamechainEnterQuoteResult,
	SamechainEnterResult,
} from '../../domain/value-objects/zap'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { TokenApprovalService } from '../evm/token-approval.service'
import { TransactionFeeService } from '../evm/transaction-fee.service'
import { parsePurchase } from '../rips/parse-purchase'
import { ripsAbi } from '../rips/rips-abi'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { LiFiApiService } from './li-fi-api.service'
import { ContractCallsQuote } from './schemas/contract-calls.schema'

export const SLIPPAGE = 0.005
export const ENTER_RIP_GAS_LIMIT = 800_000n

/**
 * OKX resolves its own route at execution time and sometimes lands on a
 * Tessera pool that reverts with "T8: Insufficient Liquidity". The route is
 * not visible in the quote, so the aggregator itself has to be excluded.
 */
export const DENIED_EXCHANGES = ['okx']

const SEND_GAS_COST_TYPE = 'SEND'

type EnterArgs = {
	presetId: number
	config: Config
	paymentCurrency: Currency
	entryCount: number
}

@Injectable()
export class LiFiService {
	private readonly ripsContractAddress: EvmAddress

	constructor(
		@Inject(RIPS_CONTRACT) ripsContract: ChainAddress,
		private readonly liFiApiService: LiFiApiService,
		private readonly evmTransactionService: EvmTransactionService,
		private readonly tokenApprovalService: TokenApprovalService,
		private readonly transactionFeeService: TransactionFeeService,
	) {
		this.ripsContractAddress = toEvmAddress(ripsContract.address)
	}

	async quoteEnterSamechain(
		wallet: Wallet,
		args: EnterArgs,
	): Promise<SamechainEnterQuoteResult> {
		const { paymentCurrency } = args

		const quote = await this.fetchEnterQuote(wallet, args)
		const chainId = evmChainIdFromCurrency(paymentCurrency)

		return {
			amountIn: {
				currency: paymentCurrency,
				amount: BigInt(quote.action.fromAmount),
			},
			transactionQuote: {
				blockchainFee: await this.blockchainFee(quote, chainId),
			},
		}
	}

	async enterSamechain(
		wallet: Wallet,
		args: EnterArgs,
	): Promise<SamechainEnterResult> {
		const { paymentCurrency } = args

		const quote = await this.fetchEnterQuote(wallet, args)
		const chainId = evmChainIdFromCurrency(paymentCurrency)
		const userAddress = evmAddressFromWallet(wallet)

		await this.tokenApprovalService.approveIfNeeded({
			wallet,
			currency: paymentCurrency,
			amount: BigInt(quote.action.fromAmount),
			spender: getAddress(quote.estimate.approvalAddress),
			owner: userAddress,
		})

		const { gasLimit } = quote.transactionRequest

		if (!gasLimit) {
			throw new Error(
				'LI.FI quote is missing the gas limit, cannot send the transaction',
			)
		}

		// Estimating this route locally under-reports the gas its nested swap
		// needs, so the limit LI.FI quoted is used instead.
		const request: TransactionRequestEIP1559 = {
			to: getAddress(quote.transactionRequest.to),
			data: quote.transactionRequest.data,
			value: BigInt(quote.transactionRequest.value),
			gas: BigInt(gasLimit),
		}

		const { transaction, receipt } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		const purchase = parsePurchase(receipt, this.ripsContractAddress)

		if (!purchase) {
			throw new TransactionFailedError(
				`RipEntered event not found in transaction: ${transaction.id}`,
			)
		}

		return { transaction, purchase }
	}

	private fetchEnterQuote(wallet: Wallet, args: EnterArgs) {
		const { presetId, config, paymentCurrency, entryCount } = args

		const userAddress = evmAddressFromWallet(wallet)
		const entryCurrency = config.entryPrice.currency
		const amountOut = config.entryPrice.amount * BigInt(entryCount)

		return this.liFiApiService.fetchContractCallsQuote({
			userAddress,
			currencyIn: paymentCurrency,
			currencyOut: entryCurrency,
			amountOut,
			slippage: SLIPPAGE,
			denyExchanges: DENIED_EXCHANGES,
			call: {
				targetAddress: this.ripsContractAddress,
				callData: this.buildEnterRipCallData({
					presetId: BigInt(presetId),
					entryCount: BigInt(entryCount),
					recipient: userAddress,
				}),
				gasLimit: ENTER_RIP_GAS_LIMIT,
			},
		})
	}

	private buildEnterRipCallData(args: {
		presetId: bigint
		entryCount: bigint
		recipient: EvmAddress
	}): Hex {
		const { presetId, entryCount, recipient } = args

		return encodeFunctionData({
			abi: ripsAbi,
			functionName: 'enterRip',
			args: [presetId, entryCount, recipient],
		})
	}

	private blockchainFee(quote: ContractCallsQuote, chainId: number) {
		const sendGasCost = quote.estimate.gasCosts.find(
			(cost) => cost.type === SEND_GAS_COST_TYPE,
		)

		if (!sendGasCost?.limit) {
			throw new Error(
				'LI.FI quote is missing the send gas limit, cannot price the transaction',
			)
		}

		return this.transactionFeeService.estimateFee(
			BigInt(sendGasCost.limit),
			chainId,
		)
	}
}
