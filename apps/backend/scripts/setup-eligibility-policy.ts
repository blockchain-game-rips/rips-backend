import { NestFactory } from '@nestjs/core'
import fs from 'fs'
import path from 'path'
import { ProvisionModule } from '../src/infrastructure/provision/provision.module'
import { SetupEligibilityPolicyService } from '../src/infrastructure/provision/setup-eligibility-policy.service'
import { getEnvSafe } from '../src/utils/common'

async function main() {
	const documentPath = getEnvSafe('TERMS_DOCUMENT_PATH')
	const resolvedPath = path.resolve(documentPath)

	const termsDocument = new Uint8Array(fs.readFileSync(resolvedPath))

	const app = await NestFactory.createApplicationContext(ProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})

	const setupService = app.get(SetupEligibilityPolicyService)

	await setupService.setup(termsDocument)

	await app.close()
}

void main()
