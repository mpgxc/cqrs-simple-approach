type Ok<T> = {
	kind: 'ok';
	isOk: true;
	value: T;
};

type Err<T> = {
	kind: 'err';
	isOk: false;
	error: T;
};

const Ok = <T>(value?: Optional<T>): Ok<T> => ({
	kind: 'ok',
	isOk: true,
	value: value as T,
});

const Err = <T>(error: T): Err<T> => ({
	kind: 'err',
	isOk: false,
	error,
});

const Combine = <T>(notifications: Notifications<T>): Err<T[]> =>
	Err(notifications.map(({ error }) => error));

/**
 * Result type to handle success and error cases.
 * @param T Type of the success value.
 * @param E Type of the error value.
 *
 * @example Result<SomeType, SomeErrorType>
 */
export type Result<T, E> = Ok<T> | Err<E>;
export type Notifications<T> = Array<Err<T>>;
export type Optional<T> = T | null | undefined;
export type OptionalAsync<T> = Promise<Optional<T>>;

export type OriginalReplace<T, R extends Partial<T>> = Omit<T, keyof R> & R;

/**
 * Ajudinha do Copilot :)
 */
export type Replace<T, R> = {
	[P in keyof T]: P extends keyof R
		? R[P] extends object
			? T[P] extends object
				? Replace<T[P], R[P]>
				: R[P]
			: R[P]
		: T[P];
};

export const Result = {
	Ok,
	Err,
	Combine,
};
