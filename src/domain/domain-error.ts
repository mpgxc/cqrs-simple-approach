export type Domains = 'Customer' | 'Transaction' | 'Wallet';

export class DomainError extends Error {
	public readonly timestamp: Date;

	constructor(
		public readonly domain: Domains,
		message: string,
	) {
		super(message);
		this.name = 'DomainError';
		this.timestamp = new Date();
	}

	toString(): string {
		return `${this.name} [${this.domain}]: ${this.message} at ${this.timestamp.toISOString()}`;
	}
}
