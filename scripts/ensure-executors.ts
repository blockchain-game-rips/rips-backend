import { NestFactory } from '@nestjs/core'
import { ProvisionModule } from '../src/infrastructure/provision/provision.module'
import { ProvisionService } from '../src/infrastructure/provision/provision.service'
import { getEnvSafe } from '../src/utils/common'

async function main() {
	const count = Number(getEnvSafe('EXECUTOR_COUNT'))

	const app = await NestFactory.createApplicationContext(ProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})

	const provisionService = app.get(ProvisionService)

	await provisionService.ensureExecutors(count)

	await app.close()
}

void main()
