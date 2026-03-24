export abstract class GetPriceUseCase {
	abstract execute(): Promise<number>
}
