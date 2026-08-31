import request, { Agent } from 'supertest'
import { App } from 'supertest/types'
import { USER_API_KEY_HEADER } from '../../src/presentation/shared/access/user-api-key.header'
import { TEST_USER_API_KEY } from './env'

export function userRequest(server: App): Agent {
	return request.agent(server).set(USER_API_KEY_HEADER, TEST_USER_API_KEY)
}
