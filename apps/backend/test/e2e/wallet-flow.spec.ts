import { setNativeBalance } from '@rips/test-harness'
import { parseEther } from 'viem'
import { NATIVE_CURRENCY_CHAIN_ADDRESS } from '../fixtures/entities'
import { botRequest } from '../utils/bot-request'
import { useRipsApp } from '../utils/rips-app'

const USER_TG_ID = '123456789'
const DEPOSIT_AMOUNT = parseEther('1')
const WITHDRAW_AMOUNT = parseEther('0.1')
const RECIPIENT_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const { chain, address } = NATIVE_CURRENCY_CHAIN_ADDRESS
const CHAIN_ADDRESS_QUERY = `${chain.namespace}:${chain.reference}:${address}`

describe('Wallet flow E2E', () => {
	const ctx = useRipsApp()

	it('creates a user and returns an EVM wallet address', async () => {
		const res = await botRequest(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: USER_TG_ID })
			.expect(201)

		expect(res.body.wallets['eip155']).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('deposits funds — balance reflects on-chain transfer', async () => {
		const userRes = await botRequest(ctx.app.getHttpServer())
			.get(`/users/${USER_TG_ID}`)
			.expect(200)

		const walletAddress = userRes.body.wallets['eip155']

		await setNativeBalance(ctx.publicClient, walletAddress, DEPOSIT_AMOUNT)

		const balanceRes = await botRequest(ctx.app.getHttpServer())
			.get(
				`/wallets/balances?chainAddress=${CHAIN_ADDRESS_QUERY}&chainAddress=${CHAIN_ADDRESS_QUERY}`,
			)
			.set('x-telegram-id', USER_TG_ID)
			.expect(200)

		expect(BigInt(balanceRes.body.balances[0].amount)).toBe(DEPOSIT_AMOUNT)
	})

	it('withdraws funds and sends them on-chain', async () => {
		const recipientBalanceBefore = await ctx.publicClient.getBalance({
			address: RECIPIENT_ADDRESS,
		})

		const res = await botRequest(ctx.app.getHttpServer())
			.post('/wallets/withdrawals')
			.set('x-telegram-id', USER_TG_ID)
			.send({
				amountIn: {
					amount: WITHDRAW_AMOUNT.toString(),
					currencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
				},
				currencyOutChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
				recipientAddress: RECIPIENT_ADDRESS,
			})
			.expect(200)

		const { withdrawal } = res.body

		expect(withdrawal.status).toBe('succeeded')
		expect(withdrawal.transaction.id).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(typeof withdrawal.transaction.cost.amount).toBe('string')
		expect(typeof withdrawal.transaction.cost.currency.symbol).toBe(
			'string',
		)

		const recipientBalanceAfter = await ctx.publicClient.getBalance({
			address: RECIPIENT_ADDRESS,
		})

		expect(recipientBalanceAfter - recipientBalanceBefore).toBe(
			WITHDRAW_AMOUNT,
		)
	})
})
