import { writeFile } from "node:fs/promises";

const dataPath = new URL("../data/snack-requests.json", import.meta.url);
const totalRequests = 1_200;
const recentRequests = [
  {
    id: "REQ-1049",
    requester: "Derek Ashford",
    department: "Sales",
    snack: "Fancy peanut-butter pretzels",
    itemCost: 26,
    status: "pending",
    requestedAt: "2026-05-16",
    notes: "Client team is visiting and specifically asked for the fancy pretzels.",
  },
  {
    id: "REQ-1051",
    requester: "Cass Morgan",
    department: "People Ops",
    snack: "Celebration macadamia box",
    itemCost: 18.5,
    status: "pending",
    requestedAt: "2026-05-16",
    notes: "Tiny morale moment for the new-hire paperwork completion table.",
  },
  {
    id: "REQ-1042",
    requester: "Margot Lane",
    department: "Facilities",
    snack: "Pretzel rods",
    itemCost: 8,
    status: "pending",
    requestedAt: "2026-05-15",
    notes: "For the post-retrospective snack bowl.",
  },
  {
    id: "REQ-2188",
    requester: "Sonia Patel",
    department: "Office Operations",
    snack: "Emergency cheese crackers",
    itemCost: 14.5,
    status: "pending",
    requestedAt: "2026-05-14",
    notes: "The fourth-floor vending machine made a bad sound and is no longer trusted.",
  },
  {
    id: "REQ-2187",
    requester: "Devon Reed",
    department: "Legal",
    snack: "Trademark trail mix",
    itemCost: 18.75,
    status: "pending",
    requestedAt: "2026-05-14",
    notes: "The meeting moved twice, but Legal still expects trail mix.",
  },
  {
    id: "REQ-2186",
    requester: "Priya Shah",
    department: "Finance",
    snack: "Licorice for budget review",
    itemCost: 27.25,
    status: "needs-override",
    requestedAt: "2026-05-13",
    notes: "Budget review ran long and Finance morale is legally fragile.",
  },
  {
    id: "REQ-2185",
    requester: "Akira Tanaka",
    department: "Engineering",
    snack: "Release-window bananas",
    itemCost: 11.2,
    status: "approved",
    requestedAt: "2026-05-13",
    notes: "Having a rough day. Need a pack of \"bananas\".",
  },
];

const requesters = [
  "Marta Soto",
  "Luis Navarro",
  "Nia Brooks",
  "Owen Price",
  "Talia Chen",
  "Ken Mercer",
  "Rina Iyer",
  "Gabe Wallace",
  "Iris Kim",
  "Dan Fletcher",
  "Mona Silva",
  "Jules Harper",
  "Farah Haddad",
  "Theo Morgan",
  "Bri Carter",
  "Cal Jensen",
  "Imani Okafor",
  "Vik Mehta",
  "Noor Rahman",
  "Elena Rossi",
];
const departments = [
  "Facilities",
  "Office Operations",
  "Finance",
  "Engineering",
  "People Ops",
  "Legal",
  "Sales",
  "Product",
  "IT",
  "Consumables Governance",
];
const snacks = [
  "Printer room crackers",
  "Backup hummus",
  "Conference almonds",
  "Emergency bananas",
  "Granola packets",
  "Visitor pretzel sleeves",
  "Compliance cookies",
  "Risk-review raisins",
  "Quarterly popcorn",
  "Unlabeled cashews",
  "Meeting mints",
  "Cabinet jerky",
  "Spreadsheet sunflower seeds",
  "Policy pretzels",
  "Audit trail mix",
];
const requesterNotes = [
  "We have visitors from Region 12 and the cabinet is down to mint dust.",
  "Please use the vendor from last quarter; Procurement said not to ask why.",
  "This is for the printer-room cleanup crew after the toner incident.",
  "I can pick these up myself if the reimbursement form stops looping.",
  "The all-hands moved earlier and the snack table is now a risk surface.",
  "Please approve before the 3 p.m. facilities walkthrough.",
  "This replaces the batch that disappeared during the offsite planning meeting.",
  "Legal asked that these remain sealed until the almond question is settled.",
  "We need shelf-stable options for the room with the unreliable badge reader.",
  "The team agreed this is not a recurring request unless anyone asks.",
];

const generatedRequests = Array.from(
  { length: totalRequests - recentRequests.length },
  (_, index) => createGeneratedRequest(index),
);

const requests = [...recentRequests, ...generatedRequests].sort((left, right) =>
  right.requestedAt.localeCompare(left.requestedAt),
);

await writeFile(dataPath, `${JSON.stringify(requests, null, 2)}\n`);

function createGeneratedRequest(index) {
  const daysAgo = 3 + Math.floor(index / 3);
  const requestedAt = formatDate(daysAgo);
  const status = getStatus(index);
  const requester = requesters[index % requesters.length];
  const snack = snacks[(index * 7) % snacks.length];
  const department = departments[(index * 7) % departments.length];
  const itemCost = Number((3.25 + ((index * 37) % 2_875) / 100).toFixed(2));
  const request = {
    id: `REQ-${String(5000 - index).padStart(4, "0")}`,
    requester,
    department,
    snack,
    itemCost,
    status,
    requestedAt,
  };

  const shouldHaveNote = index % 43 === 0 || itemCost > 31.5 || (status === "pending" && index % 5 === 0);

  if (shouldHaveNote) {
    request.notes = requesterNotes[(index * 11) % requesterNotes.length];
  }

  return request;
}

function getStatus(index) {
  if (index % 17 === 0) {
    return "pending";
  }

  if (index % 11 === 0) {
    return "needs-override";
  }

  if (index % 7 === 0) {
    return "rejected";
  }

  return "approved";
}

function formatDate(daysAgo) {
  const date = new Date("2026-05-17T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);

  return date.toISOString().slice(0, 10);
}
