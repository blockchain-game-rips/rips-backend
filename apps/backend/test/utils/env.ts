export const TEST_ADMIN_API_KEY = 'test-admin-api-key'
export const TEST_BOT_API_KEY = 'test-bot-api-key'

// The app reads these from the environment while the Nest module is being
// constructed, so tests must provide them before compiling the module.
export function provisionTestEnv(): void {
	process.env.ADMIN_API_KEY ??= TEST_ADMIN_API_KEY
	process.env.BOT_API_KEY ??= TEST_BOT_API_KEY
}
