import { Injectable } from '@nestjs/common'
import { ReferrerWithStates } from '../../../domain/entities/referrer'
import { GetReferrerInput, GetReferrerUseCase } from './get-referrer.use-case'

@Injectable()
export class GetReferrerService extends GetReferrerUseCase {
	async execute(_input: GetReferrerInput): Promise<ReferrerWithStates> {
		throw new Error('TODO: implement get referrer')
	}
}
