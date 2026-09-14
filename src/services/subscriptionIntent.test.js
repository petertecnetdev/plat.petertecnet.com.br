import { shouldRetrySubscriptionRequest } from "./subscriptionIntent";

const errorWithStatus = (status) => ({ response: { status } });

describe("shouldRetrySubscriptionRequest", () => {
  test.each([408, 425, 429, 500, 502, 503])("retries transient HTTP %s", (status) => {
    expect(shouldRetrySubscriptionRequest(errorWithStatus(status))).toBe(true);
  });

  test.each([400, 401, 403, 404, 409, 422])("does not retry terminal HTTP %s", (status) => {
    expect(shouldRetrySubscriptionRequest(errorWithStatus(status))).toBe(false);
  });

  test("retries network failures without an HTTP response", () => {
    expect(shouldRetrySubscriptionRequest(new Error("network"))).toBe(true);
  });
});
