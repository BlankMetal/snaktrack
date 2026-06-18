import assert from "node:assert/strict";
import employeeStartDates from "../data/employee-start-dates.json" with { type: "json" };
import snackRequests from "../data/snack-requests.json" with { type: "json" };
import {
  getEmployeeTenureAtRequest,
  getSnackBudgetForTenure,
  preapproveSnackRequest,
} from "../app/services/approval-rules.service.js";
import { createSnackRequestsService } from "../app/services/snack-requests.service.js";

assert.equal(getSnackBudgetForTenure("2026-01-17", "2026-05-17"), 10);
assert.equal(getSnackBudgetForTenure("2025-05-17", "2026-05-17"), 20);
assert.equal(getSnackBudgetForTenure("1970-01-01", "2026-05-17"), 30);
assert.equal(getSnackBudgetForTenure(employeeStartDates["SAMPLE EMPLOYEE"], "2026-05-17"), 30);

const margotRequest = snackRequests.find((request) => request.id === "REQ-1042");
const derekRequest = snackRequests.find((request) => request.id === "REQ-1049");
const cassRequest = snackRequests.find((request) => request.id === "REQ-1051");
const missingStartDateRequesters = [
  ...new Set(snackRequests.map((request) => request.requester)),
].filter((requester) => !employeeStartDates[requester]);

assert.deepEqual(missingStartDateRequesters, []);

assert.equal(preapproveSnackRequest(margotRequest).status, "approved");
assert.equal(preapproveSnackRequest(margotRequest).ok, true);
assert.equal(getEmployeeTenureAtRequest(margotRequest).label, "7 years, 2 months at request date");

const derekResult = preapproveSnackRequest(derekRequest);

assert.equal(derekResult.ok, false);
assert.equal(derekResult.code, "requires-budget-override");
assert.equal(derekResult.status, "pending");
assert.equal(derekResult.budget, 10);
assert.equal(derekResult.overage, 16);
assert.equal(getEmployeeTenureAtRequest(derekRequest).label, "1 month at request date");

const cassResult = preapproveSnackRequest(cassRequest);

assert.equal(cassResult.ok, false);
assert.equal(cassResult.code, "requires-budget-override");
assert.equal(cassResult.status, "pending");
assert.equal(cassResult.budget, 10);
assert.equal(cassResult.overage, 8.5);
assert.equal(getEmployeeTenureAtRequest(cassRequest).label, "1 month at request date");

const requestService = createSnackRequestsService(snackRequests);
assert.equal(requestService.getRequestsByRequester("SAMPLE EMPLOYEE").length, 0);

const createdRequest = requestService.createRequest({
  requester: "SAMPLE EMPLOYEE",
  department: "Unassigned Snack Intake",
  snack: "Test crackers",
  itemCost: 12.34,
  notes: "Local test filing.",
});

assert.equal(createdRequest.status, "pending");
assert.equal(createdRequest.requester, "SAMPLE EMPLOYEE");
assert.equal(requestService.getRequests()[0].id, createdRequest.id);
assert.equal(requestService.getRequests().length, snackRequests.length + 1);
assert.deepEqual(requestService.getRequestsByRequester("SAMPLE EMPLOYEE"), [createdRequest]);

requestService.updateRequestStatus(createdRequest.id, "rejected");
assert.equal(requestService.getRequestById(createdRequest.id).status, "rejected");
assert.equal(requestService.getRequestsByRequester("SAMPLE EMPLOYEE")[0].status, "rejected");

requestService.reset();
assert.equal(requestService.getRequests().length, snackRequests.length);
assert.equal(requestService.getRequestsByRequester("SAMPLE EMPLOYEE").length, 0);
assert.throws(() => requestService.getRequestById(createdRequest.id));

const noPendingService = createSnackRequestsService(snackRequests, {
  demoMode: "no-pending",
});

assert.equal(noPendingService.getRequests().some((request) => request.status === "pending"), false);
assert.equal(snackRequests.some((request) => request.status === "pending"), true);

console.log("Snack approval rule checks passed.");
