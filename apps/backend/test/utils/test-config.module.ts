import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { USE_ALCHEMY_BALANCES_KEY } from '../../src/configuration/configuration'

// Tests run against a local anvil chain, so balances must be read via RPC
// rather than Alchemy's hosted API (which reads real mainnet state).
function loadTestConfig() {
	return { [USE_ALCHEMY_BALANCES_KEY]: false }
}

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true, load: [loadTestConfig] })],
})
export class TestConfigModule {}
