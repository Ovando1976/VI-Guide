import assert from "node:assert/strict";

import {
  addCalendarDays,
  getUsviToday,
  isBookableEndDate,
  isBookableStartDate,
  isIsoCalendarDate,
} from "../lib/booking/booking-dates";

assert.equal(
  getUsviToday(new Date("2026-08-05T03:30:00.000Z")),
  "2026-08-04",
  "USVI date should remain on the prior calendar day before 04:00 UTC",
);
assert.equal(
  getUsviToday(new Date("2026-08-05T04:30:00.000Z")),
  "2026-08-05",
  "USVI date should advance after local midnight",
);

assert.equal(isIsoCalendarDate("2026-08-05"), true);
assert.equal(isIsoCalendarDate("2026-02-29"), false);
assert.equal(isIsoCalendarDate("2028-02-29"), true);
assert.equal(isIsoCalendarDate("2026-13-01"), false);
assert.equal(isIsoCalendarDate("2026-8-5"), false);

assert.equal(isBookableStartDate("2026-08-05", "2026-08-05"), true);
assert.equal(isBookableStartDate("2026-08-04", "2026-08-05"), false);
assert.equal(isBookableStartDate("not-a-date", "2026-08-05"), false);

assert.equal(isBookableEndDate("2026-08-05", "2026-08-06"), true);
assert.equal(isBookableEndDate("2026-08-05", "2026-08-05"), false);
assert.equal(isBookableEndDate("2026-08-05", "2026-08-04"), false);

assert.equal(addCalendarDays("2026-08-31", 1), "2026-09-01");
assert.equal(addCalendarDays("2028-02-28", 1), "2028-02-29");
assert.equal(addCalendarDays("2026-02-28", 1), "2026-03-01");
assert.equal(addCalendarDays("invalid", 1), "");

console.log("Booking date tests passed.");
