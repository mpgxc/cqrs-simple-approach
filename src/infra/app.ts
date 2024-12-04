import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { z } from 'zod';
import { RegisterCustomerCommand } from '../commands/register-customer-command.js';
import { CommandBusSingleton } from './container.js';

const commandBus = CommandBusSingleton.getInstance();

const app = new Hono({ strict: true }).basePath('/api');

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

class RegisterCustomerController {
	async handle(payload: RegisterCustomerRequest) {
		const cmd = new RegisterCustomerCommand(payload);

		await commandBus.dispatch(cmd);
	}
}

const registerCustomerController = new RegisterCustomerController();

app.use(async (ctx, next) => {
	if (ctx.req.method === 'POST') {
		const body = await ctx.req.text();

		if (!body) {
			return ctx.json(
				{
					message: 'Invalid payload',
					errors: [
						{
							code: 'invalid_type',
							expected: 'object',
							received: 'null',
							path: [],
							message: 'Expected object, received null',
						},
					],
				},
				400,
			);
		}
	}

	await next();
});

app.post('/register', async (ctx) => {
	const payload = await ctx.req.json();

	const validPayload = registerCustomerSchema.safeParse(payload);

	if (!validPayload.success) {
		return ctx.json(
			{
				message: 'Invalid payload',
				errors: validPayload.error.errors,
			},
			400,
		);
	}

	await registerCustomerController.handle(payload);

	return ctx.json({ message: 'Customer registered' });
});

app.get('/', (ctx) => {
	return ctx.json({ message: 'Hello, World!' });
});

app.onError((err, ctx) => {
	console.error(err);

	return ctx.json({ message: 'Internal server error' }, 500);
});

serve(
	{
		fetch: app.fetch,
		port: 3009,
	},
	(o) => {
		console.log(`🔥 Server is running on http://${o.address}:${o.port}/api`);
	},
);
