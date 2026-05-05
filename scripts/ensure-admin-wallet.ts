import { NestFactory } from '@nestjs/core'
import { ProvisionModule } from '../src/infrastructure/provision/provision.module'
import { ProvisionService } from '../src/infrastructure/provision/provision.service'
import { toEvmAddress } from '../src/domain/value-objects/evm-address'
import { toKmsKeyId } from '../src/domain/value-objects/kms-key-id'
import { getEnvSafe } from '../src/utils/common'

async function main() {
	const address = toEvmAddress(getEnvSafe('ADMIN_WALLET_ADDRESS'))
	const kmsKeyId = toKmsKeyId(getEnvSafe('ADMIN_KMS_KEY_ID'))

	const app = await NestFactory.createApplicationContext(ProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})

	const provisionService = app.get(ProvisionService)

	await provisionService.seedAdminWallet(address, kmsKeyId)

	await app.close()
}

void main()
