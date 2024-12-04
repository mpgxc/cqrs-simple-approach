import { ApplicationError } from '../commons/application-error.js';
import { Result } from '../commons/result.js';
import type {
	Command,
	CommandHandler,
	Query,
	QueryHandler,
} from '../commons/types.js';

export abstract class MessageBus<Handler, Message> {
	private handlers: Map<string, Handler> = new Map();

	public register(messageName: string, handler: Handler) {
		this.handlers.set(messageName, handler);
	}

	public getHandler(messageName: string): Handler {
		const handler = this.handlers.get(messageName);

		if (!handler) {
			throw new Error(`No handler registered for message ${messageName}`);
		}

		return handler;
	}

	public hasHandler(messageName: string): boolean {
		return this.handlers.has(messageName);
	}

	public getHandlers(): Map<string, Handler> {
		return this.handlers;
	}

	abstract dispatch<Output = void>(
		message: Message,
	): Promise<Result<Output, ApplicationError>>;

	abstract dispatchAll<Output = void>(
		messages: Message[],
	): Promise<Result<Output[], ApplicationError>>;
}

export class CommandBus extends MessageBus<CommandHandler<Command>, Command> {
	async dispatch<Output = void>(
		command: Command,
	): Promise<Result<Output, ApplicationError>> {
		const handler = this.getHandler(command.command);

		if (!handler) {
			return Result.Err(
				new ApplicationError(
					`No handler registered for command ${command.command}`,
				),
			);
		}

		const output = await handler.handle(command);

		if (!output.isOk) {
			console.error(`Error handling command ${command.command}:`, output.error);

			return Result.Err(output.error);
		}

		return Result.Ok();
	}

	async dispatchAll<Output = void>(
		commands: Command[],
	): Promise<Result<Output[], ApplicationError>> {
		const finalized = await Promise.all(
			commands.map((command) => this.dispatch(command)),
		);

		const errors = finalized.filter((finished) => !finished.isOk);

		if (errors.length > 0) {
			return Result.Err(
				new ApplicationError(
					`Errors handling commands: ${errors.map((error) => error.error)}`,
				),
			);
		}

		return Result.Ok();
	}
}
