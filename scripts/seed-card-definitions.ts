import { NestFactory } from '@nestjs/core'
import { SeedCardDefinitionsService } from 'src/infrastructure/seed/seed-card-definitions.service'
import { SeedModule } from 'src/infrastructure/seed/seed.module'
import { getEnvSafe } from 'src/utils/common'
import fs from 'fs'
import path from 'path'

async function main() {
	const configPath = getEnvSafe('CARD_DEFINITIONS_PATH')
	const resolvedPath = path.resolve(configPath)

	const raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'))

	const app = await NestFactory.createApplicationContext(SeedModule, {
		logger: ['log', 'error', 'warn'],
	})

	const seedService = app.get(SeedCardDefinitionsService)

	const config = seedService.parseConfig(raw)

	await seedService.seed(config)

	await app.close()
}

main()
