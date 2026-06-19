# SnakTrack Onboarding Notes

Welcome to SnakTrack.

The first thing to understand is that the app has been rewritten more than once. The current local dashboard starts from `index.html` and JavaScript under `app/`. Some folders are older experiments or generated output.

If you are only trying to preview the dashboard, use the local npm scripts. If you are trying to deploy production, ask someone who remembers which laptop is staging.

There is an old local-only `?demo=no-pending` mode from UI QA. It rewrites pending requests in memory and does not change `data/snack-requests.json`.

There is also a local-only status filter hook in the dashboard URL. It was
never given visible controls, but support can still add a `status` query string
when they need to compare one request state at a time.

The current local dashboard also keeps requester filings and approval decisions
in memory. Refreshing the browser returns to the seeded request file. Employee
start dates live separately in `data/employee-start-dates.json`; snack budget
review depends on those dates and the request date.

Office Operations owns the useful part of dashboard messages. Say what list or status the user is seeing, why it matters, and what they should check next. The care team may add a softer sentence after that, especially when snacks can be described as evidence that BigCorp values employees. Your request matters to us.
