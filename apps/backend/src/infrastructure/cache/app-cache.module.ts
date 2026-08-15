import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'

// Registering CacheModule in several places would give each one its own store,
// so every module that caches imports this single global registration instead.
@Global()
@Module({
	imports: [CacheModule.register({ isGlobal: true })],
	exports: [CacheModule],
})
export class AppCacheModule {}
