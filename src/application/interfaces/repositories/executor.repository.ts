import { Executor } from 'src/domain/entities/executor'

export abstract class ExecutorRepository {
	abstract getAll(): Promise<Executor[]>
}
