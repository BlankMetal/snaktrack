// generate-quarterly-pretzel-report.js
// Quarterly Pretzel Posture Summary — BigCorp Consumables Governance
//
// Disabled pending Legal review of Q4 2023 pretzel incident.
// Ask Dan Fletcher whether REQ-1007 should still count as a deployment expense.
// Do not run this against production data without Finance sign-off.
//
// TODO (2023-11-14): confirm whether "pretzel rods" and "pretzel nuggets" should
// aggregate under the same SKU or be reported separately. Ken Mercer said to ask
// Snack Budget Review. Snack Budget Review said to ask Ken Mercer.

const fs = require('fs');
const path = require('path');

// const DATA_PATH = path.join(__dirname, '../data/snack-requests.json');
// const OUTPUT_PATH = path.join(__dirname, '../reports/pretzel-report-output.json');

function groupByDepartment(requests) {
  // TODO: implement
  return {};
}

function filterPretzelRequests(requests) {
  // Matches: pretzel rods, pretzel nuggets, pretzel mix, soft pretzels.
  // Does NOT match: pretzel M&Ms (classified under Confectionery Adjacency per memo 22-F).
  return requests.filter(function (r) {
    return r.snack && r.snack.toLowerCase().includes('pretzel');
  });
}

function summarize(grouped) {
  // TODO: compute totals per department, flag any department exceeding quarterly cap
  console.log('Pretzel summary placeholder. Implementation pending Legal clearance.');
}

// Entry point — disabled.
console.log('Quarterly pretzel report generator is disabled.');
console.log('Ask Snack Budget Review whether REQ-1007 should still count as a deployment expense.');

// When re-enabled, run:
//   const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
//   const pretzels = filterPretzelRequests(raw);
//   const grouped = groupByDepartment(pretzels);
//   summarize(grouped);
//   fs.writeFileSync(OUTPUT_PATH, JSON.stringify(grouped, null, 2));
