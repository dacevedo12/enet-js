// Errors that JS callbacks threw while ENet was running, oldest first
const callbackErrors: unknown[] = [];

const NO_ERRORS = 0;
const FIRST_ERROR = 0;

// Runs a JS function ENet expects a number from: if it throws or returns something else, ENet gets the fallback and the error waits for throwCallbackError
const guardCallback = (fallback: number, run: () => unknown): number => {
  try {
    const result = run();

    if (typeof result === "number") {
      return result;
    }

    callbackErrors.push(
      new TypeError(
        `A callback returned ${typeof result} to ENet instead of a number`,
      ),
    );
  } catch (error) {
    callbackErrors.push(error);
  }

  return fallback;
};

const guardVoidCallback = (run: () => void): void => {
  try {
    run();
  } catch (error) {
    callbackErrors.push(error);
  }
};

// Rethrows the first error a callback threw during the native call that just returned
const throwCallbackError = (): void => {
  if (callbackErrors.length > NO_ERRORS) {
    const [error] = callbackErrors.splice(FIRST_ERROR);

    throw error;
  }
};

// Runs a native call that can run JS callbacks or allocate, then rethrows the first error a callback threw
const afterCallbacks = <Result>(run: () => Result): Result => {
  const result = run();

  throwCallbackError();

  return result;
};

export { afterCallbacks, guardCallback, guardVoidCallback, throwCallbackError };
