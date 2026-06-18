import React from "react";
import { SnackBadge } from "./SnackBadge.jsx";

export function ApprovalCard({ request, onApprove }) {
  return (
    <article className="approval-card approval-card--future">
      <header>
        <SnackBadge status={request.status} />
        <strong>{request.snack}</strong>
      </header>
      <p>
        {request.requester} requested {request.quantity} units.
      </p>
      {request.status === "pending" ? (
        <button type="button" onClick={() => onApprove(request.id)}>
          Approve
        </button>
      ) : null}
    </article>
  );
}

