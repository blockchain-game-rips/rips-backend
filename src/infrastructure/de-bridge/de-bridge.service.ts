import { Inject } from '@nestjs/common'
import axios from 'axios'
import { ZapService } from 'src/application/interfaces/zap.service'
import { EIP155 } from 'src/constants'
import { Config } from 'src/domain/entities/config'
import { Currency } from 'src/domain/entities/currency'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import { Address, encodeFunctionData, getAddress } from 'viem'
import { ripsAbi } from '../rips/rips-abi'
import { RIPS_SC_ADDRESS } from '../rips/rips.constants'

const DEBRIDGE_API_URL = 'https://api.dln.trade/v1.0'

export class DeBridgeService implements ZapService {
	constructor(
		@Inject(RIPS_SC_ADDRESS) private readonly ripsContractAddress: Address,
	) {}

	async quote(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<bigint> {
		const { config, paymentCurrency, ticketCount, stakeId } = args

		const ticketCurrency = config.ticketPrice.currency
		const totalTicketAmount =
			config.ticketPrice.amount * BigInt(ticketCount)

		const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

		const hookCalldata = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'buyTickets',
			args: [BigInt(stakeId), BigInt(ticketCount), userAddress],
		})

		const { data } = await axios.get(
			`${DEBRIDGE_API_URL}/dln/order/create-tx`,
			{
				params: {
					srcChainId: paymentCurrency.chainAddress.chain.reference,
					srcChainTokenIn: paymentCurrency.chainAddress.address,
					srcChainTokenInAmount: 'auto',
					srcChainOrderAuthorityAddress: userAddress,
					dstChainId: ticketCurrency.chainAddress.chain.reference,
					dstChainTokenOut: ticketCurrency.chainAddress.address,
					dstChainTokenOutAmount: totalTicketAmount.toString(),
					dstChainTokenOutRecipient: this.ripsContractAddress,
					dstChainOrderAuthorityAddress: userAddress,
					dlnHook: JSON.stringify({
						type: 'evm_transaction_call',
						data: {
							to: this.ripsContractAddress,
							calldata: hookCalldata,
						},
					}),
				},
			},
		)
		const fs = await import('fs')
		fs.writeFileSync('data.json', JSON.stringify(data, null, 4))

		return 0n
	}

	buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<Transaction> {
		throw new Error('Method not implemented.')
	}
}
