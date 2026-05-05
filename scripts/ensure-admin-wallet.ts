import { NestFactory } from '@nestjs/core'
import { ProvisionModule } from '../src/infrastructure/provision/provision.module'
import { ProvisionService } from '../src/infrastructure/provision/provision.service'

async function main() {
	const app = await NestFactory.createApplicationContext(ProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})

	const provisionService = app.get(ProvisionService)

	await provisionService.ensureAdminWallet()

	await app.close()
}

void main()
