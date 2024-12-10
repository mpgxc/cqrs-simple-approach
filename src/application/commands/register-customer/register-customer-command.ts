import type { Command } from '../../../commons/types.js';

export class RegisterCustomerCommand implements Command {
	public command: string;
	public timestamp: Date;

	constructor(private readonly props: RegisterCustomerCommandPayload) {
		this.command = this.constructor.name;
		this.timestamp = new Date();
	}

	get content(): RegisterCustomerCommandPayload {
		return this.props;
	}
}

export type RegisterCustomerCommandPayload = {
	email: string;
	phone: string;
	fullName: string;
	password: string;
	document: string;
	documentType: 'Cpf' | 'Cnpj';
	role: 'Customer' | 'Lojista';
};
