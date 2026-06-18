// Old dashboard controller kept for reference during the 2021 migration.
// The current app enters through app/app.module.js.

export function bootOldDashboard() {
  const table = document.querySelector("#legacy-snack-table");

  if (!table) {
    return;
  }

  table.innerHTML = "<tr><td>Legacy dashboard disabled. Ask Dan Fletcher.</td></tr>";
}
