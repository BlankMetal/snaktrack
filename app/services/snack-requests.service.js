import initialRequests from "../../data/snack-requests.json" with { type: "json" };

const LOCAL_DEMO_REQUEST_DATE = "2026-05-17";

export function createSnackRequestsService(seedRequests = initialRequests, options = {}) {
  const sourceRequests = applyDemoMode(seedRequests, options.demoMode);
  let requests = sourceRequests.map(copyRequest);
  let nextRequestNumber = getNextRequestNumber(sourceRequests);

  return {
    getRequests() {
      return requests.map(copyRequest);
    },

    getRequestById(id) {
      const request = requests.find((item) => item.id === id);

      if (!request) {
        throw new Error(`Snack request ${id} was not found.`);
      }

      return copyRequest(request);
    },

    getRequestsByRequester(requester) {
      return requests
        .filter((request) => request.requester === requester)
        .map(copyRequest);
    },

    createRequest({ requester, department, snack, itemCost, requestedAt, notes }) {
      const request = {
        id: `REQ-${nextRequestNumber}`,
        requester,
        department,
        snack,
        itemCost,
        status: "pending",
        requestedAt: requestedAt || LOCAL_DEMO_REQUEST_DATE,
      };

      if (notes) {
        request.notes = notes;
      }

      nextRequestNumber += 1;
      requests = [request, ...requests];

      return copyRequest(request);
    },

    updateRequestStatus(id, status) {
      requests = requests.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request,
      );
    },

    countByStatus() {
      return requests.reduce((counts, request) => {
        counts[request.status] = (counts[request.status] || 0) + 1;
        return counts;
      }, {});
    },

    reset() {
      requests = sourceRequests.map(copyRequest);
      nextRequestNumber = getNextRequestNumber(sourceRequests);
    },
  };
}

export { LOCAL_DEMO_REQUEST_DATE };

export function formatRequestAge(requestedAt) {
  const requestedDate = new Date(`${requestedAt}T12:00:00`);
  const today = new Date("2026-05-17T12:00:00");
  const ageInDays = Math.round((today - requestedDate) / 86_400_000);

  if (ageInDays < 1) {
    return "today";
  }

  if (ageInDays === 1) {
    return "1 day ago";
  }

  return `${ageInDays} days ago`;
}

function copyRequest(request) {
  return { ...request };
}

function getNextRequestNumber(requests) {
  const highestRequestNumber = requests.reduce((highest, request) => {
    const match = /^REQ-(\d+)$/.exec(request.id || "");

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return highestRequestNumber + 1;
}

function applyDemoMode(seedRequests, demoMode) {
  if (demoMode !== "no-pending") {
    return seedRequests;
  }

  return seedRequests.map((request) =>
    request.status === "pending"
      ? {
          ...request,
          status: "approved",
          notes: `${request.notes} Local no-pending demo mode.`,
        }
      : request,
  );
}
