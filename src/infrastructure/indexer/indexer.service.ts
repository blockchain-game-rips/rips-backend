import { Injectable } from '@nestjs/common'
import { getSdk, Sdk } from 'generated/graphql/generated'
import { GraphQLClient } from 'graphql-request'
import { getEnvSafe } from 'src/utils/common'

@Injectable()
export class IndexerService {
	readonly sdk: Sdk

	constructor() {
		const client = new GraphQLClient(getEnvSafe('INDEXER_URL'))

		this.sdk = getSdk(client)
	}
}
