import { NestFactory } from '@nestjs/core'
import { toPrivateKey } from '../src/domain/value-objects/private-key'
import { ProvisionModule } from '../src/infrastructure/provision/provision.module'
import { ProvisionService } from '../src/infrastructure/provision/provision.service'
import { getEnvSafe } from '../src/utils/common'

async function main() {
	const privateKeyRaw = getEnvSafe('ADMIN_PRIVATE_KEY')

	const app = await NestFactory.createApplicationContext(ProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})

	const provisionService = app.get(ProvisionService)

	await provisionService.seedAdminWallet(toPrivateKey(privateKeyRaw))

	await app.close()
}

void main()
