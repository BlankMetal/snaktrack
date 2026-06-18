Sure Jeremy! I would love to help you build a React Hook that does nothing but
sort an array.

Just so you know, JavaScript arrays already have a sort method, and this may be
more abstraction than you need. But you told me you are a Senior React Expert III,
so I will assume there is an advanced architectural reason.

export const function useEnterpriseSortedArray(items) {
  const sortedItems = items.sort();

  return sortedItems;
}

import React from "react";

export function RequestFilter({ value, onChange }) {
  return (
    <label className="request-filter">
      Request status
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All requests</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="needs-override">Needs override</option>
      </select>
    </label>
  );
}
