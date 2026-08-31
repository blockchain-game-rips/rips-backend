import request, { Agent } from 'supertest'
import { App } from 'supertest/types'
import { BOT_API_KEY_HEADER } from '../../src/presentation/shared/access/bot-api-key.header'
import { TEST_BOT_API_KEY } from './env'

export function botRequest(server: App): Agent {
	return request.agent(server).set(BOT_API_KEY_HEADER, TEST_BOT_API_KEY)
}
