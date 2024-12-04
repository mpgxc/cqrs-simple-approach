import { z } from 'zod';

export const schema = z.object({
	NODE_ENV: z.string(),
	PORT: z.string(),
	DATABASE_URL: z.string(),
});

export type Environment = z.infer<typeof schema>;

export const environment: Environment = schema.parse(process.env);
