import { execSync } from 'child_process'
import getPort from 'get-port'

const POSTGRES_CONTAINER_NAME = 'rips-test-postgres'
const POSTGRES_PASSWORD = 'test'
const POSTGRES_DB = 'rips_test'

export class Postgres {
	private _port: number | undefined

	get port() {
		if (!this._port) {
			throw new Error('Postgres not started')
		}

		return this._port
	}

	get databaseUrl() {
		return `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${this.port}/${POSTGRES_DB}`
	}

	async start() {
		this._port = await getPort()

		execSync(
			`docker run --rm -d \
				--name ${POSTGRES_CONTAINER_NAME} \
				-e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
				-e POSTGRES_DB=${POSTGRES_DB} \
				-p ${this._port}:5432 \
				postgres:16-alpine`,
			{ stdio: 'pipe' },
		)

		execSync(
			`until docker exec ${POSTGRES_CONTAINER_NAME} pg_isready -U postgres; do sleep 0.2; done`,
			{ stdio: 'pipe' },
		)

		//TODO: rewrite
		execSync(`yarn prisma db push --force-reset`, {
			stdio: 'inherit',
			env: {
				...process.env,
				DATABASE_URL: this.databaseUrl,
				PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
			},
		})
	}

	stop() {
		execSync(`docker stop ${POSTGRES_CONTAINER_NAME}`, { stdio: 'pipe' })
	}
}

export function usePostgres() {
	const postgres = new Postgres()

	beforeAll(async () => {
		await postgres.start()
		process.env.DATABASE_URL = postgres.databaseUrl
	})

	afterAll(() => {
		postgres.stop()
	})

	return { postgres }
}
