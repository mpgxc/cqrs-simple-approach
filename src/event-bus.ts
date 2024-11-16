export class Account {
	id!: string;
	name!: string;
	balance!: number;
}

export type AccountEvent =
	| { type: 'AccountCreated'; timestamp: Date; initialBalance: number }
	| {
			type: 'TransferMade';
			timestamp: Date;
			amount: number;
			toAccountId: string;
	  }
	| {
			type: 'TransferReceived';
			timestamp: Date;
			amount: number;
			fromAccountId: string;
	  };

/**
 * Com event sourcing
 */
export class AccountES {
	readonly id: string;
	readonly name: string;
	readonly balance: number;
	private readonly events: AccountEvent[];

	private constructor(
		id: string,
		name: string,
		balance: number,
		events: AccountEvent[] = [],
	) {
		this.id = id;
		this.name = name;
		this.balance = balance;
		this.events = events;
	}

	state() {}

	static create(id: string, name: string, initialBalance: number): Account {
		const events: AccountEvent[] = [
			{
				type: 'AccountCreated',
				timestamp: new Date(),
				initialBalance,
			},
		];

		return new AccountES(id, name, initialBalance, events);
	}

	transfer(amount: number, toAccountId: string): Account {
		if (this.balance < amount) {
			throw new Error('Insufficient balance');
		}

		const newBalance = this.balance - amount;
		const event: AccountEvent = {
			type: 'TransferMade',
			timestamp: new Date(),
			amount,
			toAccountId,
		};

		return new AccountES(this.id, this.name, newBalance, [
			...this.events,
			event,
		]);
	}

	receiveTransfer(amount: number, fromAccountId: string): Account {
		const newBalance = this.balance + amount;
		const event: AccountEvent = {
			type: 'TransferReceived',
			timestamp: new Date(),
			amount,
			fromAccountId,
		};

		return new AccountES(this.id, this.name, newBalance, [
			...this.events,
			event,
		]);
	}

	getEventHistory(): AccountEvent[] {
		return this.events;
	}
}

export interface Command {
	command: string;
	timestamp: Date;
}

export class TransferCommand implements Command {
	public command: string;
	public timestamp: Date;

	constructor(
		public payerId: string,
		public payeeId: string,
		public amount: number,
	) {
		this.command = 'TransferCommand';
		this.timestamp = new Date();
	}
}

export class AccountRepository {
	async findOne(accountId: string): Promise<Account> {
		return AccountES.create(accountId, 'Alice', 1000);
	}

	async transaction(
		callback: (transactionalEntityManager: {
			save: (account: Account) => Promise<void>;
		}) => Promise<void>,
	): Promise<void> {
		const transactionalEntityManager = {
			save: async (account: Account) => {
				console.log(
					`Account ${account.id} saved with balance ${account.balance}`,
				);

				console.info(JSON.stringify(account, null, 2));
			},
		};

		await callback(transactionalEntityManager);
	}
}

export class NotificationRepository {
	async save(userId: string, message: string): Promise<void> {
		console.log(`Notification sent to ${userId}: ${message}`);
	}
}

/**
 * Assincrono
 */
export class NotificationService {
	constructor(
		private readonly notificationRepository: NotificationRepository,
		private queue: Array<{
			userId: string;
			message: string;
		}>,
	) {}

	async notify(userId: string, message: string): Promise<void> {
		this.queue.push({ userId, message });

		await this.processQueue();
	}

	async processQueue(): Promise<void> {
		while (this.queue.length > 0) {
			const notification = this.queue.shift();

			if (!notification) {
				break;
			}

			await this.notificationRepository.save(
				notification.userId,
				notification.message,
			);

			console.log(
				`Processing notification for ${notification.userId}: ${notification.message}`,
			);
		}
	}
}

/**
 * Sincrono
 */
export class ExternalAuthorizationService {
	async authorize(): Promise<boolean> {
		return true;
	}
}

export class TransferHandler {
	constructor(
		private readonly accountRepository: AccountRepository,
		private readonly notificationService: NotificationService,
		private readonly externalAuthorizationService: ExternalAuthorizationService,
	) {}

	async execute(command: TransferCommand): Promise<void> {
		const { payerId, payeeId, amount } = command;

		const payer = await this.accountRepository.findOne(payerId);
		const payee = await this.accountRepository.findOne(payeeId);

		if (!payer || !payee) {
			throw new Error('Invalid accounts');
		}

		if (payer.balance < amount) {
			throw new Error('Insufficient balance');
		}

		const isAuthorized = await this.externalAuthorizationService.authorize();
		if (!isAuthorized) {
			throw new Error('Transaction not authorized');
		}

		await this.accountRepository.transaction(
			async (transactionalEntityManager) => {
				payer.balance -= amount;
				payee.balance += amount;

				await transactionalEntityManager.save(payer);
				await transactionalEntityManager.save(payee);
			},
		);

		try {
			await this.notificationService.notify(
				payeeId,
				`You have received ${amount} from ${payerId}`,
			);
		} catch (error) {
			console.error('Failed to send notification', error);
		}
	}
}

export type EventHandler = (event: Command) => Promise<void>;

export class EventBus {
	private handlers: { [eventName: string]: EventHandler[] } = {};

	register(eventName: string, handler: EventHandler) {
		if (!this.handlers[eventName]) {
			this.handlers[eventName] = [];
		}

		this.handlers[eventName].push(handler);
	}

	async dispatch(event: Command) {
		if (this.handlers[event.command]) {
			for (const handler of this.handlers[event.command]) {
				await handler(event);
			}
		}
	}

	async dispatchAll(events: Command[]) {
		for (const event of events) {
			await this.dispatch(event);
		}
	}
}

export class CommandBus {
	private handlers: Map<string, EventHandler> = new Map();

	register(commandName: string, handler: EventHandler) {
		this.handlers.set(commandName, handler);
	}

	async dispatch(command: Command) {
		const handler = this.handlers.get(command.command);

		if (!handler) {
			throw new Error(`No handler registered for command ${command.command}`);
		}

		await handler(command);
	}

	async dispatchAll(commands: Command[]) {
		for (const command of commands) {
			await this.dispatch(command);
		}
	}
}

(async () => {
	const eventBus = new CommandBus();

	const transferHandler = new TransferHandler(
		new AccountRepository(),
		new NotificationService(
			new NotificationRepository(),
			new Array<{
				userId: string;
				message: string;
			}>(),
		),
		new ExternalAuthorizationService(),
	);

	eventBus.register('TransferCommand', async (event) => {
		await transferHandler.execute(event as TransferCommand);
	});

	const payeeId = crypto.randomUUID();
	const payerId = crypto.randomUUID();

	const command1 = new TransferCommand(payerId, payeeId, 100);
	const command2 = new TransferCommand(payerId, payeeId, 200);
	const command3 = new TransferCommand(payerId, payeeId, 200);

	await eventBus.dispatchAll([command1, command2, command3]);
})();
