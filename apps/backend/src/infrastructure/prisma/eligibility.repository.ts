import { Injectable } from '@nestjs/common'
import {
	EligibilityRepository,
	EligibilityWrite,
} from '../../application/interfaces/repositories/eligibility.repository'
import {
	EligibilityPolicy,
	UserEligibility,
} from '../../domain/entities/eligibility'
import {
	CountryCode,
	toCountryCode,
} from '../../domain/value-objects/country-code'
import { TelegramId } from '../../domain/value-objects/telegram-id'
import { PrismaService } from './prisma.service'

export const POLICY_SINGLETON = 'eligibility'
export const FIRST_TERMS_VERSION = 1

type PolicyRecord = {
	blockedCountries: string[]
	termsVersion: number
	updatedAt: Date
}

type UserEligibilityRecord = {
	country: string
	termsVersion: number
	acceptedAt: Date
}

@Injectable()
export class PrismaEligibilityRepository extends EligibilityRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async findPolicy(): Promise<EligibilityPolicy | null> {
		const record = await this.prisma.eligibilityPolicy.findUnique({
			where: { singleton: POLICY_SINGLETON },
		})

		if (!record) return null

		return toDomainPolicy(record)
	}

	async findByTelegramId(
		telegramId: TelegramId,
	): Promise<UserEligibility | null> {
		// At most one row can match: `userId` is unique, so the relation filter
		// selects a single user's single record. Prisma's `findUnique` cannot
		// take a relation filter, hence `findFirst` over a one-row result.
		const record = await this.prisma.userEligibility.findFirst({
			where: { user: { telegramId } },
		})

		if (!record) return null

		return toDomainUserEligibility(record)
	}

	async record(input: EligibilityWrite): Promise<UserEligibility> {
		const user = await this.prisma.user.findUniqueOrThrow({
			where: { telegramId: input.telegramId },
			select: { id: true },
		})

		const written = {
			userId: user.id,
			country: input.country,
			termsVersion: input.termsVersion,
			acceptedAt: input.acceptedAt,
		}

		const record = await this.prisma.userEligibility.upsert({
			where: { userId: user.id },
			create: written,
			update: written,
		})

		return toDomainUserEligibility(record)
	}

	async replaceBlockedCountries(
		blockedCountries: CountryCode[],
	): Promise<EligibilityPolicy> {
		const record = await this.prisma.eligibilityPolicy.update({
			where: { singleton: POLICY_SINGLETON },
			data: { blockedCountries },
		})

		return toDomainPolicy(record)
	}

	/**
	 * The bytes and the version bump are one statement, so they cannot come
	 * apart: a failure leaves the previous document and version intact.
	 *
	 * The version is incremented in the database rather than read, added to and
	 * written back. Reading first would let two concurrent uploads both observe
	 * version N and both write N+1, filing one document under the other's
	 * version — a race a transaction at the default isolation level would not
	 * close either.
	 */
	async replaceTermsDocument(
		termsFile: Uint8Array<ArrayBuffer>,
	): Promise<EligibilityPolicy> {
		const record = await this.prisma.eligibilityPolicy.upsert({
			where: { singleton: POLICY_SINGLETON },
			create: {
				singleton: POLICY_SINGLETON,
				blockedCountries: [],
				termsVersion: FIRST_TERMS_VERSION,
				termsFile,
			},
			update: {
				termsFile,
				termsVersion: { increment: 1 },
			},
		})

		return toDomainPolicy(record)
	}
}

function toDomainPolicy(record: PolicyRecord): EligibilityPolicy {
	return {
		blockedCountries: record.blockedCountries.map(toCountryCode),
		termsVersion: record.termsVersion,
		updatedAt: record.updatedAt,
	}
}

function toDomainUserEligibility(
	record: UserEligibilityRecord,
): UserEligibility {
	return {
		country: record.country,
		termsVersion: record.termsVersion,
		acceptedAt: record.acceptedAt,
	}
}
