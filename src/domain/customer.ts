import { z } from 'zod';
import { Result } from '../commons/result.js';
import { DomainError } from './domain-error.js';

const CustomerValidationSchema = z.object({
	id: z
		.string()
		.uuid()
		.default(() => crypto.randomUUID()),
	fullName: z.string().min(3),
	email: z.string().email(),
	password: z.string().min(6),
	phone: z.string().min(1),
	document: z.string().min(1),
	documentType: z.enum(['Cpf', 'Cnpj']).default('Cpf'),
	role: z.enum(['Customer', 'Lojista']).default('Customer'),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const CustomerCreationSchema = CustomerValidationSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type CustomerCreationProps = z.infer<typeof CustomerCreationSchema>;
export type CustomerProps = z.infer<typeof CustomerValidationSchema>;

export class Customer {
	private constructor(private properties: CustomerProps) {}

	public get attributes(): CustomerProps {
		return this.properties;
	}

	public static create(
		props: CustomerCreationProps,
	): Result<Customer, DomainError> {
		const customer = CustomerValidationSchema.safeParse(props);

		if (!customer.success) {
			const issues = customer.error.errors.map(
				(e) => `${e.path}: ${e.message} - ${e.code}`,
			);

			return Result.Err(
				new DomainError(
					'Customer',
					`Invalid customer data! ${issues.join('\n')}`,
				),
			);
		}

		const instance = new Customer(customer.data);

		return Result.Ok(instance);
	}
}
