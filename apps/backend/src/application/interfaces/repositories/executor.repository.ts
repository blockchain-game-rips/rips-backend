import { Executor } from '../../../domain/entities/executor'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { EncryptedKey } from '../encryption.service'

export abstract class ExecutorRepository {
	abstract getAll(): Promise<Executor[]>
	abstract create(
		address: EvmAddress,
		encryptedKey: EncryptedKey,
	): Promise<Executor>
}
