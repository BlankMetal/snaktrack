import { readFile } from "node:fs/promises";

const dataPath = new URL("../data/snack-requests.json", import.meta.url);
const rawRequests = await readFile(dataPath, "utf8");
const requests = JSON.parse(rawRequests);

const requiredFields = [
  "id",
  "requester",
  "department",
  "snack",
  "itemCost",
  "status",
  "requestedAt",
];
const requiredStatuses = ["pending", "approved", "rejected", "needs-override"];
const minimumRequestCount = 1_000;
const missingFields = requests.flatMap((request) =>
  requiredFields
    .filter((field) => request[field] === undefined || request[field] === "")
    .map((field) => `${request.id || "unknown request"} missing ${field}`),
);
const oldCostFields = requests
  .filter((request) => "quantity" in request || "unitCost" in request)
  .map((request) => `${request.id || "unknown request"} uses retired quantity/unitCost fields`);
const duplicateIds = requests
  .map((request) => request.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index)
  .map((id) => `${id} is duplicated`);
const sortProblems = requests
  .slice(1)
  .filter((request, index) => request.requestedAt > requests[index].requestedAt)
  .map((request) => `${request.id} is out of requestedAt descending order`);

const statusCounts = requests.reduce((counts, request) => {
  counts[request.status] = (counts[request.status] || 0) + 1;
  return counts;
}, {});

if (requests.length < minimumRequestCount) {
  missingFields.push(
    `demo feed has ${requests.length} requests; expected at least ${minimumRequestCount}`,
  );
}

requiredStatuses.forEach((status) => {
  if (!statusCounts[status]) {
    missingFields.push(`demo feed missing ${status} requests`);
  }
});

const validationErrors = [...missingFields, ...oldCostFields, ...duplicateIds, ...sortProblems];

if (validationErrors.length > 0) {
  console.error("Demo data is not ready:");
  validationErrors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Demo snack data ready: ${requests.length} requests (${Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${status}`)
    .join(", ")}).`,
);
