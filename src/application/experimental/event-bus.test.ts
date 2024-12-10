import { describe, expect, it, vi } from 'vitest';
import {
	AccountES,
	AccountRepository,
	type Command,
	EventBus,
	ExternalAuthorizationService,
	NotificationRepository,
	NotificationService,
	TransferCommand,
	TransferHandler,
} from './event-bus.js';

describe('TransferHandler', () => {
	it('should execute transfer command successfully', async () => {
		const accountRepository = new AccountRepository();
		const notificationRepository = new NotificationRepository();
		const notificationService = new NotificationService(
			notificationRepository,
			[],
		);
		const externalAuthorizationService = new ExternalAuthorizationService();
		const transferHandler = new TransferHandler(
			accountRepository,
			notificationService,
			externalAuthorizationService,
		);

		const payerId = 'payer1';
		const payeeId = 'payee1';
		const command = new TransferCommand(payerId, payeeId, 100);

		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payerId, 'Payer', 1000),
		);
		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payeeId, 'Payee', 500),
		);
		vi.spyOn(externalAuthorizationService, 'authorize').mockResolvedValueOnce(
			true,
		);
		const transactionSpy = vi
			.spyOn(accountRepository, 'transaction')
			.mockImplementation(async (callback) => {
				await callback({
					save: async () => {},
				});
			});
		const notifySpy = vi
			.spyOn(notificationService, 'notify')
			.mockResolvedValueOnce();

		await transferHandler.execute(command);

		expect(transactionSpy).toHaveBeenCalled();
		expect(notifySpy).toHaveBeenCalledWith(
			payeeId,
			`You have received 100 from ${payerId}`,
		);
	});

	it('should throw error if accounts are invalid', async () => {
		const accountRepository = new AccountRepository();
		const notificationRepository = new NotificationRepository();
		const notificationService = new NotificationService(
			notificationRepository,
			[],
		);
		const externalAuthorizationService = new ExternalAuthorizationService();
		const transferHandler = new TransferHandler(
			accountRepository,
			notificationService,
			externalAuthorizationService,
		);

		const command = new TransferCommand('invalidPayer', 'invalidPayee', 100);

		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(null as never);

		await expect(transferHandler.execute(command)).rejects.toThrow(
			'Invalid accounts',
		);
	});

	it('should throw error if balance is insufficient', async () => {
		const accountRepository = new AccountRepository();
		const notificationRepository = new NotificationRepository();
		const notificationService = new NotificationService(
			notificationRepository,
			[],
		);
		const externalAuthorizationService = new ExternalAuthorizationService();
		const transferHandler = new TransferHandler(
			accountRepository,
			notificationService,
			externalAuthorizationService,
		);

		const payerId = 'payer1';
		const payeeId = 'payee1';
		const command = new TransferCommand(payerId, payeeId, 1000);

		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payerId, 'Payer', 500),
		);
		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payeeId, 'Payee', 500),
		);

		await expect(transferHandler.execute(command)).rejects.toThrow(
			'Insufficient balance',
		);
	});

	it('should throw error if transaction is not authorized', async () => {
		const accountRepository = new AccountRepository();
		const notificationRepository = new NotificationRepository();
		const notificationService = new NotificationService(
			notificationRepository,
			[],
		);
		const externalAuthorizationService = new ExternalAuthorizationService();
		const transferHandler = new TransferHandler(
			accountRepository,
			notificationService,
			externalAuthorizationService,
		);

		const payerId = 'payer1';
		const payeeId = 'payee1';
		const command = new TransferCommand(payerId, payeeId, 100);

		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payerId, 'Payer', 1000),
		);
		vi.spyOn(accountRepository, 'findOne').mockResolvedValueOnce(
			AccountES.create(payeeId, 'Payee', 500),
		);
		vi.spyOn(externalAuthorizationService, 'authorize').mockResolvedValueOnce(
			false,
		);

		await expect(transferHandler.execute(command)).rejects.toThrow(
			'Transaction not authorized',
		);
	});
});

describe('EventBus', () => {
	it('should register and dispatch events', async () => {
		const eventBus = new EventBus();
		const handler = vi.fn().mockResolvedValueOnce(undefined);
		eventBus.register('TestEvent', handler);

		const event: Command = { command: 'TestEvent', timestamp: new Date() };
		await eventBus.dispatch(event);

		expect(handler).toHaveBeenCalledWith(event);
	});

	it('should dispatch multiple events', async () => {
		const eventBus = new EventBus();
		const handler = vi.fn().mockResolvedValue(undefined);
		eventBus.register('TestEvent', handler);

		const events: Command[] = [
			{ command: 'TestEvent', timestamp: new Date() },
			{ command: 'TestEvent', timestamp: new Date() },
		];
		await eventBus.dispatchAll(events);

		expect(handler).toHaveBeenCalledTimes(2);
	});
});
