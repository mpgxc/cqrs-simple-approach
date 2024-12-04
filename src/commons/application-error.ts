export class ApplicationError extends Error {
	public readonly timestamp: Date;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();
	}

	toString(): string {
		return `${this.name}: ${this.message} at ${this.timestamp.toISOString()}`;
	}
}
