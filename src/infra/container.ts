import { RegisterCustomerCommandHandler } from '../application/commands/register-customer/register-customer-command-handler.js';
import { RegisterCustomerCommand } from '../application/commands/register-customer/register-customer-command.js';
import { CommandBus } from './command-bus.js';

export class CommandBusSingleton {
	private static instance: CommandBus;

	private constructor() {}

	public static getInstance(): CommandBus {
		if (!CommandBusSingleton.instance) {
			CommandBusSingleton.instance = new CommandBus();

			CommandBusSingleton.instance.register(
				RegisterCustomerCommand.name,
				new RegisterCustomerCommandHandler(),
			);
		}

		return CommandBusSingleton.instance;
	}
}
