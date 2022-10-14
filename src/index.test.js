import * as xstate from "xstate";

import * as index from "./index";

expect.extend({
  async toEventuallyReach(service, expectedState, timeout = 1000) {
    const options = {
      comment: "state.matches",
      isNot: this.isNot,
      promise: this.promise,
    };
    const message = () =>
      this.utils.matcherHint(
        "toEventuallyReach",
        undefined,
        undefined,
        options,
      ) +
      "\n\n" +
      this.utils.printDiffOrStringify(
        expectedState,
        service.state.value,
        "Expected",
        "Received",
        this.expand,
      );

    return new Promise((resolve, reject) => {
      // Fail if we don't reach the desired state in time.
      const failTimeout = setTimeout(() => {
        resolve({
          message,
          pass: false,
        });
      }, timeout);

      // Setup a listener so we can succeed a soon as possible.
      service.onTransition((state) => {
        if (state.matches(expectedState)) {
          // Stop the failure timeout from resolving.
          clearTimeout(failTimeout);

          resolve({
            message,
            pass: true,
          });
        }
      });

      // Check if we're already in the expected state.
      if (service.state.matches(expectedState)) {
        // Stop the failure timeout from resolving.
        clearTimeout(failTimeout);

        resolve({
          message,
          pass: true,
        });
      }
    });
  },
});

test('should eventually reach "success" flattened', async () => {
  let userAlerted = false;

  const mockFetchMachine = index.fetchMachine.withConfig({
    services: {
      fetchFromAPI: (_, event) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ id: event.id });
          }, 50);
        }),
    },
    actions: {
      alertUser: () => {
        // set a flag instead of executing the original action
        userAlerted = true;
      },
    },
  });

  const fetchService = xstate.interpret(mockFetchMachine);

  fetchService.start();

  // send zero or more events to the service that should
  // cause it to eventually reach its expected state
  fetchService.send({ type: "FETCH", id: 42 });

  await expect(fetchService).toEventuallyReach("success");

  // assert that effects were executed
  expect(userAlerted).toBeTruthy();
});
