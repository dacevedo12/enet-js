// Errors that JS callbacks threw while ENet was running, oldest first
const callbackErrors: unknown[] = [];

const NO_ERRORS = 0;
const FIRST_ERROR = 0;

// Runs a JS function ENet invoked: if it throws, ENet gets the fallback and the error waits for throwCallbackError
const guardCallback = <Result>(fallback: Result, run: () => Result): Result => {
  try {
    return run();
  } catch (error) {
    callbackErrors.push(error);

    return fallback;
  }
};

const guardVoidCallback = (run: () => void): void => {
  try {
    run();
  } catch (error) {
    callbackErrors.push(error);
  }
};

// Called after a native call that can run JS callbacks, to rethrow the first error one of them threw
const throwCallbackError = (): void => {
  if (callbackErrors.length > NO_ERRORS) {
    const [error] = callbackErrors.splice(FIRST_ERROR);

    throw error;
  }
};

export { guardCallback, guardVoidCallback, throwCallbackError };
