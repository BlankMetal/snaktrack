# SnakTrack Pro Enterprise

Welcome to SnakTrack Pro Enterprise, the single source of truth for snack purchase approvals, snack inventory reconciliation, and the quarterly snack posture review.

SnakTrack was originally built to unify snack requests across Facilities, Finance, and the old Microsoft Access snack database. It has since absorbed several pilots, a React migration, two deployment rituals, and one policy memo about almonds that nobody can find.

## Current Local Preview

If you only need to run the current dashboard locally:

1. Run `npm install`
2. Run `npm run dev`
3. Open the local URL shown in your terminal.

This starts the current browser dashboard. The notes below are historical and may not match the current code.

## Current Identity Configuration

The active UI gets product, parent-company, suffix, legal, and department copy from
`app/config/identity.config.js`. Change `corporateIdentity.companyName` there to
verify that parent-company references update cleanly across the visible dashboard.

Current local request changes are kept in memory. Refreshing the page reloads the
seed data from `data/snack-requests.json` and employee start dates from
`data/employee-start-dates.json`.

## Important Corporate Context

Setup is simple if you follow these instructions exactly.

SnakTrack Pro Enterprise is currently owned by Office Operations, except for the snack budget approval logic, which belongs to the Snack Budget Review desk, except during office moves, when the spreadsheet in the shared drive is considered canonical. If the spreadsheet and the dashboard disagree, ask Dan Fletcher for the password and then ask Jeremy Wagner whether Dan Fletcher is still the right person.

The snack budget thresholds are documented in docs/snack-budget-policy.md. Do not ask about the pretzel thing.

The care team treats SnakTrack as proof that BigCorp provides employee care through visible snack access. Office Operations still owns the actual status wording: say what happened, who owns the next step, and whether the request is safe to approve. Then add the care sentence if the care team is reading over your shoulder.

Do not deploy on Fridays. Do not deploy the Thursday before a Friday. Do not mention the 2023 pretzel incident in the release notes unless Legal asks.

## Requirements

- Python 2.7
- Microsoft Access snack database access
- Node 8, but only if you are working on the React migration
- npm, unless Jeremy says not to use npm
- Office VPN
- Ask Dan Fletcher for the database password
- Ask Snack Budget Review if the snack is over the employee budget

The above list was validated in 2019 and again in a meeting where nobody had the app open.

## Starting The App

1. Connect to the office VPN.
2. Ask Dan Fletcher for the Microsoft Access snack database password.
3. Run `python server.py`.
4. Open the SnakTrack dashboard.
5. If it does not work, check whether today is Friday.

If this fails because `server.py` is missing, it may mean you are using the newer dashboard. See the local preview section above, but only after confirming with Jeremy that the React migration is complete.

## React Migration Status

The React migration is complete.

Some files may still use the older dashboard shell because the Angular routes were left in place for continuity. The modern components in `components/` should be considered the future direction, unless they are not imported anywhere, in which case they may represent the previous future direction.

Known modern components:

- `components/ApprovalCard.jsx`
- `components/SnackBadge.jsx`
- `components/EmptyState.jsx`

Use these when possible, unless the production dashboard is not using React.

## Browser Support

SnakTrack Pro Enterprise is tested and supported on the following browsers:

| Browser                  | Version | Status            |
|--------------------------|---------|-------------------|
| Internet Explorer        | 11      | Fully supported   |
| Firefox ESR              | 78      | Fully supported   |
| Chrome                   | 88      | Fully supported   |
| Edge (Legacy)            | 18      | Best effort       |
| Edge (Chromium)          | Any     | Not yet validated |
| Safari                   | Any     | Not tested        |
| Chrome (mobile)          | Any     | Not in scope      |

Employees using unsupported browsers should contact IT to request an approved browser installation. Do not attempt to install Chrome without IT approval on managed devices.

The React migration introduced some components that may require a more modern rendering environment. If the dashboard renders incorrectly, confirm that you are not in IE compatibility mode. If you are in IE compatibility mode, confirm with Jeremy whether that is intentional.

## Operations Notes

Snack requests move through the following states:

1. Pending
2. Approved
3. Rejected
4. Needs Override, which is sometimes called Budget Variance or Snack Exposure Exception

Requester intake only checks a broad retail-price cap. Approver review applies the employee snack budget based on tenure. If approvals silently fail, refresh twice and ask Snack Budget Review whether the snack exceeds the employee limit.

Messages should not promise a snack just because they sound warm. The care team may describe free snacks as a people investment, but Snack Budget Review still expects the request state to be clear.

The SnakTrack staging server lives on someone's laptop. It is usually on the left side of the office unless there is a facilities event.

## Deployment

Production deploys happen through the snack release laptop.

1. Make sure the laptop is plugged in.
2. Run `scripts/deploy-to-jeremy-laptop.sh`.
3. Wait for the printer room light to blink.
4. Verify that the dashboard says SnakTrack Pro Enterprise and not SnakTrack Express.

There is also a `dist/` folder. It is usually generated output, but it has been committed historically so the intranet preview does not panic.

## Known Issues

- Almonds.
- Some historical notes mention bulk snack review. They are incident context, not the active approval rule.
- The Microsoft Access snack database is required for production, except the current dashboard appears to use a local JSON file.
- The test suite is comprehensive, except for the parts that are not covered by the one script.
- If approvals silently fail, refresh twice and ask whether the snack exceeds the requester budget.

## Troubleshooting

If the app does not start:

1. Confirm Python 2.7 is installed.
2. Confirm Node is installed.
3. Confirm you did not deploy on Friday.
4. Confirm the office VPN did not switch to guest Wi-Fi.
5. Confirm the snack database password has not moved from Dan Fletcher to someone else.
6. Try `npm run dev` if none of the above seems connected to this repository.

If the app starts but looks old, that is probably correct.

## Ownership

Office Operations owns the dashboard experience. Snack Budget Review owns the approval policy. Engineering owns whichever build script most recently worked. Facilities owns the snack cabinets but not the data inside them.

Temporary note from 2021: replace this README once the React migration is finished.
