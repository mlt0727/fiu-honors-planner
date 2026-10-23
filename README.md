# FIU Honors Planner

Personal 2026–2027 Honors engagement planner. Chinese summaries, official English titles and source links, list/week views, four categories requiring two items each, separate attendance/official recognition, volunteer-hour tracking and Neon cloud sync.

Live site: https://fiu-honors-planner.vercel.app/

Private source: https://github.com/mlt0727/fiu-honors-planner

## Run

Node 24 is used in production.

```sh
npm ci
vercel link
vercel env pull .env.local
npm run db:init
npm run dev
```

Environment variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `OWNER_EMAIL`, `CRON_SECRET`. Provision Neon on Vercel's free plan with built-in auth. Keep all credentials in ignored `.env.local` and Vercel encrypted environment variables. Use a verified email matching `OWNER_EMAIL`; public sign-up for other accounts is rejected. The owner creates a dedicated website password through the login/settings form.

In the production branch's Neon Auth settings, add `https://fiu-honors-planner.vercel.app` to trusted domains (include the scheme, without a trailing slash) and enable **Verify at Sign-up**. The server requires a verified owner email. Anonymous session reads do not validate these settings; test POST requests before handing off registration. The SDK throws authentication errors, which the form displays separately from network failures.

## Verify

```sh
npm test
npm run typecheck
npm run build
node --env-file=.env.local scripts/check-db.mjs
node --env-file=.env.local scripts/check-auth.mjs
```

The database integration check creates scoped disposable QA records and removes them in `finally`. It uses the production save function through two independent Neon connections, checks conflicts and preferences initialization, and never sends email.

The auth smoke check uses invalid credentials and an intentionally too-short registration password. It validates the production origin, both auth POST routes and the owner restriction without creating an account or sending email. Pass another deployment URL as its first argument when needed.

## Sources and updates

`data/items.json` contains all 128 options read from the user's authorized Panther Connect browser session on October 23, 2026. `docs/sources/path-details.json` retains source descriptions; `docs/source-catalog.json` retains the original directory. The importer accepts a new authorized capture as its argument: `node scripts/import-source.mjs <capture.json>`.

`data/events.json` contains five verified upcoming events and four known past events. Duplicate finance-workshop listings are merged. The UK information session maps to two categories, but a single event counts once. Identical source options count once within a semester. The writing-center description mismatch and missing descriptions are explicitly flagged.

Daily Vercel Cron at 13:00 UTC refreshes the official public RSS feed. It updates known event times and locations; exact title matches without confirmed path attribution are marked unverified and excluded from recommendations. The public feed covers its own rolling window and cannot refresh the authenticated pathway catalog. A missing event in the feed is not treated as canceled; public-source failures retain the last verified snapshot and record a failure. Activity information should be rechecked on the linked official page before attending.

All displayed times use `America/New_York`, including daylight saving. Unknown registration deadlines remain unknown; the seven-business-day accessibility request notice is never interpreted as a registration deadline. The annual official requirement deadline is reproduced as April 9, 2027 23:59 (source says EST). Annual 20 service hours are separate.

After checking an event's official registration page, the owner can enter its deadline in the detail dialog. This private override syncs through Neon, is labeled as owner-entered in drafts, and participates in five-calendar-day reminders. The input uses New York local time even on a device in another timezone.

## Reminder review mode

The job prepares a weekly digest on Mondays and deadline reminders five New York calendar days before known registration deadlines. Optional event-start reminders are separately labeled. Completed and dismissed items, duplicate aliases, expired events and full categories are excluded. Draft keys deduplicate repeated runs.

**No email sending provider is connected and no email is sent automatically.** The owner's standing instruction requires reviewing the exact recipients, subject, body and attachments/links, then explicitly confirming each email. The app provides complete previews and an `.eml` draft download. Enabling unattended email would require a new explicit change to that preference and a configured sending service.

Neon stores only owner-scoped progress, preferences and pending drafts. The site does not log into FIU, copy FIU credentials, RSVP, or submit official experiences. Official reporting still happens in Panther Connect/GivePulse.

The approved visual reference is `docs/design.png`. Necessary content extensions and verification evidence are recorded in `docs/verification.md`.
