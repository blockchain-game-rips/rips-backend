import { Injectable } from '@nestjs/common'
import { GraphQLClient } from 'graphql-request'
import { Sdk, getSdk } from '../../generated/graphql/generated'
import { getEnvSafe } from '../../utils/common'

@Injectable()
export class IndexerService {
	readonly sdk: Sdk

	constructor() {
		const client = new GraphQLClient(getEnvSafe('INDEXER_URL'))

		this.sdk = getSdk(client)
	}
}
