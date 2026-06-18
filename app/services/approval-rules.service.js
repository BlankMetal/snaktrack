import { identityCopy } from "../config/identity.config.js";
import employeeStartDates from "../../data/employee-start-dates.json" with { type: "json" };

export const TENURE_BUDGETS = Object.freeze({
  // These thresholds are intentional. Ask Snack Budget Review before changing them.
  newEmployee: 10,
  establishedEmployee: 20,
  longTenuredEmployee: 30,
});

export function approveSnackRequest(request, startDates = employeeStartDates) {
  return preapproveSnackRequest(request, startDates);
}

export function preapproveSnackRequest(request, startDates = employeeStartDates) {
  if (!request) {
    return {
      ok: false,
      code: "request-not-found",
      status: "pending",
      message: identityCopy.notices.notFound,
    };
  }

  const employeeStartDate = startDates[request.requester];

  if (!employeeStartDate) {
    return {
      ok: false,
      code: "missing-employee-start-date",
      status: "pending",
      message: identityCopy.notices.missingStartDate(request),
    };
  }

  const budget = getSnackBudgetForTenure(employeeStartDate, request.requestedAt);
  const itemCost = Number(request.itemCost || 0);
  const overage = roundMoney(itemCost - budget);

  if (overage > 0 && !request.overrideApproved) {
    return {
      ok: false,
      code: "requires-budget-override",
      status: "pending",
      message: identityCopy.notices.budgetOverride(request, budget, overage),
      budget,
      overage,
    };
  }

  return {
    ok: true,
    status: "approved",
    message: identityCopy.notices.success(request),
  };
}

export function getSnackBudgetForTenure(startDate, requestedAt) {
  const months = countWholeMonthsBetween(startDate, requestedAt);

  if (months < 6) {
    return TENURE_BUDGETS.newEmployee;
  }

  if (months < 24) {
    return TENURE_BUDGETS.establishedEmployee;
  }

  return TENURE_BUDGETS.longTenuredEmployee;
}

export function getEmployeeTenureAtRequest(request, startDates = employeeStartDates) {
  const startDate = startDates[request.requester];

  if (!startDate) {
    return {
      ok: false,
      label: "No tenure record",
    };
  }

  const months = countWholeMonthsBetween(startDate, request.requestedAt);

  return {
    ok: true,
    label: `${formatTenureMonths(months)} at request date`,
    months,
    startDate,
  };
}

export function countWholeMonthsBetween(startDate, requestedAt) {
  const start = parseDateOnly(startDate);
  const requested = parseDateOnly(requestedAt);

  if (requested < start) {
    return 0;
  }

  let months =
    (requested.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    requested.getUTCMonth() -
    start.getUTCMonth();

  if (requested.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

function formatTenureMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  return `${years} ${years === 1 ? "year" : "years"}, ${months} ${
    months === 1 ? "month" : "months"
  }`;
}

function parseDateOnly(value) {
  return new Date(`${value}T12:00:00Z`);
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}
