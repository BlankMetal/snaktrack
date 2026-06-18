import React from "react";

export function SnackBadge({ status }) {
  const label = status.replace("-", " ");

  return <span className={`snack-badge snack-badge--${status}`}>{label}</span>;
}

