import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import fs from 'fs'
import path from 'path'
import { toPrivateKey } from '../domain/value-objects/private-key'
import { ProvisionModule } from '../infrastructure/provision/provision.module'
import { ProvisionService } from '../infrastructure/provision/provision.service'
import { SetupEligibilityPolicyService } from '../infrastructure/provision/setup-eligibility-policy.service'
import { SeedCardDefinitionsService } from '../infrastructure/seed/seed-card-definitions.service'
import { SeedModule } from '../infrastructure/seed/seed.module'
import {
	createTerminalReader,
	promptExecutorCount,
	promptPrivateKey,
} from './prompt'

/**
 * Initial setup: the steps that take a deployed system from "running" to "ready
 * to accept users". Run once, by hand, against the deployed environment:
 *
 *   docker compose run --rm \
 *     -v ./cards.json:/app/config/cards.json \
 *     -v ./terms.pdf:/app/config/terms.pdf \
 *     backend node dist/src/setup/setup.js /app/config/cards.json /app/config/terms.pdf
 *
 * The admin private key and the executor count are prompted for rather than
 * passed as environment variables, which would leave the key in shell history
 * and in `docker inspect`.
 *
 * There is no re-run guard. The steps are individually safe to repeat, but the
 * procedure is meant to happen once at deploy time; a failure part-way through
 * is resolved by hand.
 */
@Module({
	imports: [ProvisionModule, SeedModule],
})
class SetupModule {}

const CARDS_ARG_INDEX = 2
const TERMS_ARG_INDEX = 3

type SetupPaths = {
	cardsPath: string
	termsPath: string
}

function readPaths(argv: string[]): SetupPaths {
	const cardsPath = argv[CARDS_ARG_INDEX]
	const termsPath = argv[TERMS_ARG_INDEX]

	if (!cardsPath || !termsPath) {
		throw new Error(
			'Usage: node dist/src/setup/setup.js <cards.json> <terms-document>',
		)
	}

	return {
		cardsPath: path.resolve(cardsPath),
		termsPath: path.resolve(termsPath),
	}
}

async function main(): Promise<void> {
	const { cardsPath, termsPath } = readPaths(process.argv)

	const cardsRaw: unknown = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'))
	const termsDocument = new Uint8Array(fs.readFileSync(termsPath))

	const reader = createTerminalReader()

	let privateKey: string
	let executorCount: number

	try {
		privateKey = await promptPrivateKey(reader)
		executorCount = await promptExecutorCount(reader)
	} finally {
		reader.close()
	}

	const app = await NestFactory.createApplicationContext(SetupModule, {
		logger: ['log', 'error', 'warn'],
	})

	try {
		const provisionService = app.get(ProvisionService)

		await provisionService.seedAdminWallet(toPrivateKey(privateKey))

		const executors = await provisionService.ensureExecutors(executorCount)

		await provisionService.grantExecutorRoles(executors)

		const seedService = app.get(SeedCardDefinitionsService)

		await seedService.seed(seedService.parseConfig(cardsRaw))

		await app.get(SetupEligibilityPolicyService).setup(termsDocument)
	} finally {
		await app.close()
	}
}

void main().catch((error) => {
	console.error(error)

	process.exit(1)
})
