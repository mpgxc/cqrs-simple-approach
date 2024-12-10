import { z } from 'zod';
import { ApplicationError } from '../../commons/application-error.js';
import { Result } from '../../commons/result.js';
import type { Controller } from '../../commons/types.js';
import { CommandBusSingleton } from '../../infra/container.js';
import { RegisterCustomerCommand } from '../commands/register-customer/register-customer-command.js';

const commandBus = CommandBusSingleton.getInstance();

const registerCustomerSchema = z.object({
	document: z.string(),
	email: z.string().email(),
	fullName: z.string(),
	password: z.string(),
	phone: z.string(),
	documentType: z.union([z.literal('Cpf'), z.literal('Cnpj')]),
	role: z.union([z.literal('Customer'), z.literal('Lojista')]),
});

type RegisterCustomerRequest = z.infer<typeof registerCustomerSchema>;

export class RegisterCustomerController
	implements Controller<RegisterCustomerRequest>
{
	async handle(
		payload: RegisterCustomerRequest,
	): Promise<Result<void, ApplicationError>> {
		const validPayload = registerCustomerSchema.safeParse(payload);

		if (!validPayload.success) {
			return Result.Err(
				new ApplicationError(
					'Invalid payload',
					'RegisterCustomerPayloadValidationError',
				),
			);
		}

		const cmd = new RegisterCustomerCommand(payload);

		await commandBus.dispatch(cmd);

		return Result.Ok();
	}
}
