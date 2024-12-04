import { ApplicationError } from '../../commons/application-error.js';
import { Result } from '../../commons/result.js';
import type { CommandHandler } from '../../commons/types.js';
import { Customer } from '../../domain/customer.js';
import type { RegisterCustomerCommand } from '../register-customer-command.js';

export class RegisterCustomerCommandHandler
	implements CommandHandler<RegisterCustomerCommand>
{
	async handle(
		command: RegisterCustomerCommand,
	): Promise<Result<void, ApplicationError>> {
		try {
			const customer = Customer.create(command.content);

			if (!customer.isOk) {
				console.log(customer.error);

				throw new Error(customer.error.toString());
			}

			console.debug(customer.value);

			/**
			 * Here we would save the customer to the database
			 * Publish an event to the event bus: CustomerRegisteredEvent
			 */

			return Result.Ok();
		} catch (error) {
			if (error instanceof ApplicationError) {
				return Result.Err(error);
			}

			return Result.Err(
				new ApplicationError('Error handling RegisterCustomerCommand'),
			);
		}
	}
}
