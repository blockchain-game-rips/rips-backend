export abstract class KeeperUseCase {
	abstract execute(): Promise<void>
}
