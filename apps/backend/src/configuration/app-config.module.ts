import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { loadConfig } from './configuration'

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] })],
})
export class AppConfigModule {}
