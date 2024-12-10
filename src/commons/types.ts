import type { ApplicationError } from './application-error.js';
import type { Result } from './result.js';

export type QueryHandler<T extends Query, Output> = {
	handle(query: T): Promise<Result<Output, ApplicationError>>;
};

export interface CommandHandler<T extends Command> {
	handle(command: T): Promise<Result<void, ApplicationError>>;
}

export interface Controller<T> {
	handle(payload: T): Promise<Result<void, ApplicationError>>;
}

export interface Query {
	readonly query: string;
	readonly sort: string;
	readonly limit: number;
	readonly offset: number;
}

export interface Command {
	command: string;
	timestamp: Date;

	get content(): Record<string, unknown>;
}
