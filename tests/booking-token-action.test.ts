import assert from "node:assert/strict";
import test from "node:test";

import {
  bookingTokenActionQuery,
  parseBookingTokenSalonSlug,
} from "../lib/booking-token-action";

test("parseBookingTokenSalonSlug accepts valid slug", () => {
  assert.equal(parseBookingTokenSalonSlug("paw-empire"), "paw-empire");
});

test("parseBookingTokenSalonSlug rejects invalid slug", () => {
  assert.equal(parseBookingTokenSalonSlug(""), null);
  assert.equal(parseBookingTokenSalonSlug("INVALID SLUG"), null);
  assert.equal(parseBookingTokenSalonSlug("../etc"), null);
});

test("bookingTokenActionQuery encodes salon param", () => {
  assert.equal(bookingTokenActionQuery("salon-bizhu"), "salon=salon-bizhu");
});
