import { describe, expect, it } from 'vitest';
import { Customer, type CustomerCreationProps } from './customer.js';
import { DomainError } from './domain-error.js';

describe('Customer', () => {
	it('should create a customer with valid data', () => {
		const validProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'john.doe@example.com',
			password: 'password123',
			phone: '1234567890',
			document: '1234567890',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(validProps);

		expect(result.isOk).toBe(true);

		if (result.isOk) {
			const customer = result.value;
			expect(customer).toBeInstanceOf(Customer);
		}
	});

	it('should return an error for invalid fullName', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'Jo',
			email: 'john.doe@example.com',
			password: 'password123',
			phone: '1234567890',
			document: '1234567890',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;

			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toBe(
				'Invalid customer data! fullName: String must contain at least 3 character(s) - too_small',
			);
		}
	});

	it('should return an error for invalid email', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'john.doe@com',
			password: 'password123',
			phone: '1234567890',
			document: '1234567890',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;

			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toEqual(
				expect.stringContaining('Invalid customer data!'),
			);
		}
	});

	it('should return an error for invalid password', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'john.doe@example.com',
			password: 'pass',
			phone: '1234567890',
			document: '1234567890',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;
			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toEqual(
				expect.stringContaining('Invalid customer data!'),
			);
		}
	});

	it('should return an error for invalid phone', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'john.doe@example.com',
			password: 'password123',
			phone: '',
			document: '1234567890',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;

			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toEqual(
				expect.stringContaining('Invalid customer data!'),
			);
		}
	});

	it('should return an error for invalid document', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'mpgxc@gmail.com',
			password: 'password123',
			phone: '1234567890',
			document: '',
			documentType: 'Cpf',
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;

			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toEqual(
				expect.stringContaining('Invalid customer data!'),
			);
		}
	});

	it('should return an error for invalid documentType', () => {
		const invalidProps: CustomerCreationProps = {
			fullName: 'John Doe',
			email: 'mgx@gmail.com',
			password: 'password123',
			phone: '1234567890',
			document: '1234567890',
			documentType: 'Invalid' as CustomerCreationProps['documentType'],
			role: 'Customer',
		};

		const result = Customer.create(invalidProps);

		expect(!result.isOk).toBe(true);

		if (!result.isOk) {
			const error = result.error;

			expect(error).toBeInstanceOf(DomainError);
			expect(error.message).toEqual(
				expect.stringContaining('Invalid customer data!'),
			);
		}
	});
});
