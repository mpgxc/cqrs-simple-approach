import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { Replace } from './result.js';

describe('Replace type utility', () => {
	it('should replace properties in the original type with properties from the replacement type', () => {
		type Original = {
			a: number;
			b: string;
			c: boolean;
		};

		type Replacement = {
			b: number;
			c: string;
		};

		type Result = Replace<Original, Replacement>;

		const result: Result = {
			a: 1,
			b: 2,
			c: 'replaced',
		};

		expectTypeOf(result.a).toBeNumber();
		expectTypeOf(result.b).toBeNumber();
		expectTypeOf(result.c).toBeString();
		assertType<Result>(result);
	});

	it('should work with optional properties', () => {
		type Original = {
			a: number;
			b?: string;
		};

		type Replacement = {
			b: number;
		};

		type Result = Required<Replace<Original, Replacement>>;

		const result: Result = {
			a: 1,
			b: 2,
		};

		expectTypeOf(result.a).toBeNumber();
		expectTypeOf(result.b).toBeNumber();
		assertType<Result>(result);
	});

	it('should work with nested types', () => {
		type Original = {
			a: {
				b: string;
				c: number;
			};
		};

		type Replacement = {
			a: {
				c: string;
			};
		};

		type Result = Replace<Original, Replacement>;

		const result: Result = {
			a: {
				b: 'nested',
				c: 'replaced',
			},
		};

		expectTypeOf(result.a.b).toBeString();
		expectTypeOf(result.a.c).toBeString();
		assertType<Result>(result);
	});
});
