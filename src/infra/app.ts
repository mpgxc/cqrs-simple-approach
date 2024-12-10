import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { RegisterCustomerController } from '../application/controllers/register-customer-controller.js';
import { ApplicationErrorTranslatorSingleton } from '../commons/application-error.js';
import { CommandBusSingleton } from './container.js';

const app = new Hono({ strict: true }).basePath('/api');

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

const translator = ApplicationErrorTranslatorSingleton.getInstance();

app.post('/register', async (ctx) => {
	const payload = await ctx.req.json();

	const output = await registerCustomerController.handle(payload);

	if (!output.isOk) {
		const result = translator.getFormattedMessage(output.error);

		return ctx.json(
			{
				message: result.message,
				errors: [result.message],
				timestamp: result.timestamp,
			},
			result.statusCode,
		);
	}

	return ctx.json({
		message: 'Customer registered',
	});
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
