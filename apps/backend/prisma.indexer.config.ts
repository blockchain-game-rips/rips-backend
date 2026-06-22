import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
	schema: 'prisma/indexer/schema.prisma',
	datasource: {
		url: process.env['INDEXER_DATABASE_URL'],
	},
})
