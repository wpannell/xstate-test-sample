import * as xstate from "xstate";

export const fetchMachine = xstate.createMachine({
  id: "fetch",

  // Initial state
  initial: "idle",

  // States
  states: {
    idle: {
      on: {
        FETCH: { target: "pending" },
      },
    },
    pending: {
      invoke: {
        src: "fetchFromAPI",
        onDone: { target: "success" },
        onError: { target: "failure" },
      },
    },
    success: {
      entry: ["alertUser"],
    },
    failure: {
      on: {
        RETRY: { target: "pending" },
      },
    },
  },
});
