export class ApplicationError extends Error {
	public readonly timestamp: Date;

	constructor(message: string, name?: string) {
		super(message);
		this.name = name ?? ApplicationError.name;
		this.timestamp = new Date();
	}

	toString(): string {
		return `${this.name}: ${this.message} at ${this.timestamp.toISOString()}`;
	}
}

export type StatusCode = 200 | 400 | 404 | 500 | 501 | 502 | 503 | 504 | 505;

export class ApplicationErrorTranslator {
	private errors = new Map<string, number>([]);

	register(error: string, statusCode: number) {
		this.errors.set(error, statusCode);
	}

	getStatusCode(error: string): StatusCode {
		const statusCode = this.errors.get(error);

		if (!statusCode) {
			return 500;
		}

		return statusCode as StatusCode;
	}

	getFormattedMessage(error: ApplicationError): {
		message: string;
		timestamp: Date;
		statusCode: StatusCode;
	} {
		return {
			message: error.message,
			timestamp: error.timestamp,
			statusCode: this.getStatusCode(error.name),
		};
	}
}

export class ApplicationErrorTranslatorSingleton {
	private constructor() {}

	private static instance: ApplicationErrorTranslator;

	public static getInstance(): ApplicationErrorTranslator {
		if (!ApplicationErrorTranslatorSingleton.instance) {
			ApplicationErrorTranslatorSingleton.instance =
				new ApplicationErrorTranslator();

			ApplicationErrorTranslatorSingleton.instance.register(
				'RegisterCustomerPayloadValidationError',
				400,
			);
		}

		return ApplicationErrorTranslatorSingleton.instance;
	}
}
