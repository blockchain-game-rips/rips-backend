import { Controller, Get, SetMetadata, Type } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { AccessCoverageValidator } from '../../../src/presentation/shared/access/access-coverage.validator'
import {
	ACCESS_LEVEL_KEY,
	AccessLevel,
	AdminAccess,
	PublicAccess,
	UserAccess,
} from '../../../src/presentation/shared/access/access-level'

// The validator is resolved from a real container so it discovers the fixture
// controllers exactly as it discovers the application's own.
async function validatorFor(
	...controllers: Type[]
): Promise<AccessCoverageValidator> {
	const moduleRef = await Test.createTestingModule({
		imports: [DiscoveryModule],
		controllers,
		providers: [AccessCoverageValidator],
	}).compile()

	return moduleRef.get(AccessCoverageValidator)
}

@Controller('covered')
class CoveredController {
	@PublicAccess()
	@Get('public')
	public() {}

	@UserAccess()
	@Get('user')
	user() {}

	@AdminAccess()
	@Get('admin')
	admin() {}
}

@Controller('uncovered')
class UncoveredController {
	@Get('loose')
	loose() {}
}

@Controller('class-level')
@SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.User)
class ClassLevelController {
	@UserAccess()
	@Get('user')
	user() {}
}

@Controller('inheriting')
class InheritingController extends ClassLevelController {
	@UserAccess()
	@Get('own')
	own() {}
}

describe('AccessCoverageValidator', () => {
	it('accepts controllers whose every route declares a level', async () => {
		const validator = await validatorFor(CoveredController)

		expect(() => validator.onApplicationBootstrap()).not.toThrow()
	})

	it('rejects a route with no access level', async () => {
		const validator = await validatorFor(UncoveredController)

		expect(() => validator.onApplicationBootstrap()).toThrow(
			/UncoveredController.loose/,
		)
	})

	it('rejects an access level declared on the controller class', async () => {
		const validator = await validatorFor(ClassLevelController)

		expect(() => validator.onApplicationBootstrap()).toThrow(
			/ClassLevelController/,
		)
	})

	it('blames only the class that declares the level, not a subclass', async () => {
		const validator = await validatorFor(InheritingController)

		expect(() => validator.onApplicationBootstrap()).not.toThrow()
	})
})
