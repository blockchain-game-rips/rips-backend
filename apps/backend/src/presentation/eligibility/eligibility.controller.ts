import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Header,
	Param,
	Post,
	Put,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiProduces,
} from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { GetEligibilityPolicyUseCase } from '../../application/use-cases/get-eligibility-policy/get-eligibility-policy.use-case'
import { GetTermsDocumentUseCase } from '../../application/use-cases/get-terms-document/get-terms-document.use-case'
import { GetUserEligibilityUseCase } from '../../application/use-cases/get-user-eligibility/get-user-eligibility.use-case'
import { RecordEligibilityUseCase } from '../../application/use-cases/record-eligibility/record-eligibility.use-case'
import { SetBlockedCountriesUseCase } from '../../application/use-cases/set-blocked-countries/set-blocked-countries.use-case'
import { UploadTermsDocumentUseCase } from '../../application/use-cases/upload-terms-document/upload-terms-document.use-case'
import { AdminAccess, UserAccess } from '../shared/access/access-level'
import {
	TELEGRAM_ID_PARAM,
	TelegramIdParamDto,
} from '../shared/telegram-id.param'
import {
	TERMS_CONTENT_DISPOSITION,
	TERMS_CONTENT_TYPE,
} from './get-terms-document/get-terms-document.response'
import { RecordEligibilityBodyDto } from './record-eligibility/record-eligibility.request'
import { SetBlockedCountriesBodyDto } from './set-blocked-countries/set-blocked-countries.request'
import {
	EligibilityPolicyDto,
	toEligibilityPolicyDto,
} from './shared/eligibility-policy.dto'
import {
	toUserEligibilityDto,
	UserEligibilityDto,
} from './shared/user-eligibility.dto'
import { TERMS_FILE_FIELD } from './upload-terms-document/upload-terms-document.request'

/**
 * `multer` is a dependency of `@nestjs/platform-express` rather than of this
 * app, so its ambient `Express.Multer.File` types are not installed. Only the
 * buffer is read here, so the shape is declared rather than pulled in.
 */
type UploadedDocument = {
	buffer: Uint8Array<ArrayBuffer>
}

function isUploadedDocument(file: unknown): file is UploadedDocument {
	return (
		typeof file === 'object' &&
		file !== null &&
		'buffer' in file &&
		Buffer.isBuffer(file.buffer)
	)
}

@Controller('eligibility')
export class EligibilityController {
	constructor(
		private readonly getEligibilityPolicyUseCase: GetEligibilityPolicyUseCase,
		private readonly getTermsDocumentUseCase: GetTermsDocumentUseCase,
		private readonly getUserEligibilityUseCase: GetUserEligibilityUseCase,
		private readonly recordEligibilityUseCase: RecordEligibilityUseCase,
		private readonly setBlockedCountriesUseCase: SetBlockedCountriesUseCase,
		private readonly uploadTermsDocumentUseCase: UploadTermsDocumentUseCase,
	) {}

	// Declared before the `:telegramId` route, which would otherwise match
	// "policy" as a telegram id.
	@UserAccess()
	@Get('policy')
	@ZodResponse({ type: EligibilityPolicyDto })
	async getPolicy(): Promise<EligibilityPolicyDto> {
		const policy = await this.getEligibilityPolicyUseCase.execute()

		return toEligibilityPolicyDto(policy)
	}

	@AdminAccess()
	@Put('policy')
	@ZodResponse({ type: EligibilityPolicyDto })
	async setBlockedCountries(
		@Body() body: SetBlockedCountriesBodyDto,
	): Promise<EligibilityPolicyDto> {
		const policy = await this.setBlockedCountriesUseCase.execute({
			blockedCountries: body.blockedCountries,
		})

		return toEligibilityPolicyDto(policy)
	}

	@AdminAccess()
	@Post('policy/terms')
	@UseInterceptors(FileInterceptor(TERMS_FILE_FIELD))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			required: [TERMS_FILE_FIELD],
			properties: {
				[TERMS_FILE_FIELD]: { type: 'string', format: 'binary' },
			},
		},
	})
	@ZodResponse({ type: EligibilityPolicyDto })
	async uploadTerms(
		@UploadedFile() file: unknown,
	): Promise<EligibilityPolicyDto> {
		if (!isUploadedDocument(file)) {
			throw new BadRequestException(
				`A terms document is required in the "${TERMS_FILE_FIELD}" field`,
			)
		}

		const policy = await this.uploadTermsDocumentUseCase.execute({
			termsFile: file.buffer,
		})

		return toEligibilityPolicyDto(policy)
	}

	/**
	 * `@UserAccess()`, like the other user-facing eligibility reads: the user bot
	 * is the caller that delivers this document into a user's chat, and the admin
	 * bot only ever uploads.
	 *
	 * Declared before the `:telegramId` route for the same reason `policy` is.
	 */
	@UserAccess()
	@Get('policy/terms')
	@Header('Content-Type', TERMS_CONTENT_TYPE)
	@Header('Content-Disposition', TERMS_CONTENT_DISPOSITION)
	@ApiProduces(TERMS_CONTENT_TYPE)
	@ApiOkResponse({
		description: 'The current terms document.',
		schema: { type: 'string', format: 'binary' },
	})
	async getTerms(): Promise<StreamableFile> {
		const document = await this.getTermsDocumentUseCase.execute()

		return new StreamableFile(document)
	}

	@UserAccess()
	@Get(`:${TELEGRAM_ID_PARAM}`)
	@ZodResponse({ type: UserEligibilityDto })
	async getUserEligibility(
		@Param() params: TelegramIdParamDto,
	): Promise<UserEligibilityDto> {
		const eligibility = await this.getUserEligibilityUseCase.execute({
			telegramId: params.telegramId,
		})

		return toUserEligibilityDto(eligibility)
	}

	@UserAccess()
	@Post()
	@ZodResponse({ type: UserEligibilityDto })
	async recordEligibility(
		@Body() body: RecordEligibilityBodyDto,
	): Promise<UserEligibilityDto> {
		const eligibility = await this.recordEligibilityUseCase.execute({
			telegramId: body.telegramId,
			country: body.country,
			termsVersion: body.termsVersion,
		})

		return toUserEligibilityDto(eligibility)
	}
}
