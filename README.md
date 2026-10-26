# FIU Honors Planner

A Chinese/English 2026–2027 FIU Honors engagement planner. Everyone can sign in with an emailed six-digit code. Each verified account has independent progress across the four official categories (two experiences each), notes, attendance/official acceptance, volunteer hours, language and reminder drafts.

Live site: https://fiu-honors-planner.vercel.app/

Source: https://github.com/mlt0727/fiu-honors-planner

## Run

Production uses Node 24.

```sh
npm ci
vercel link
vercel env pull .env.local
npm run dev
```

Required server variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `CRON_SECRET`. Keep credentials in ignored `.env.local` and encrypted Vercel environment variables. `OWNER_EMAIL` is no longer used. Existing owner records stay under the same Neon user ID; there is no destructive data migration.

The production origin `https://fiu-honors-planner.vercel.app` must remain trusted in Neon Auth. The app uses managed Email OTP: `emailOtp.sendVerificationOtp({type:'sign-in'})`, followed by `signIn.emailOtp`. The first successful code creates a verified account; returning users use the same flow. Password and password-registration proxy routes are disabled. Provider throttling remains in effect, and the form adds a 60-second resend delay. Codes are requested only after the user clicks the send/resend button.

## Language and account boundaries

The header offers Chinese and English. Guests start in English, including browsers with an older Chinese preference, and can switch during their visit. After login, the account's cloud preference wins, including on a different device. Dates, weekdays and times use America/New_York in either language. English uses original official descriptions or saved English summaries; Chinese uses the curated catalog summaries. No runtime LLM or translation API is called.

All private reads and writes scope to the authenticated, verified Neon user ID. Clients cannot choose a data owner or reminder recipient. Writes also include the currently displayed account email so a stale page cannot save into a different account after a cookie change. Sign-out/account switches clear private view state, invalidate pending responses and notify other tabs. Focus/visibility checks revalidate the cookie session. Backup import aborts if its starting account changes.

## Verify

```sh
npm test
npm run typecheck
npm run build
node --env-file=.env.local scripts/check-db.mjs
node scripts/check-auth.mjs http://localhost:3000
```

The database check uses two independent connections and disposable user IDs, verifies separate records/preferences/language/recipients/drafts and stale-write conflicts, then removes its rows. The auth smoke check uses malformed delivery requests and an invalid code for a nonexistent address; it does not send email or create an account. Browser QA uses intercepted OTP/session responses for successful login flows. Real inbox/code entry remains a human action.

## Sources and refresh

`data/items.json` has all 128 options captured from the authorized Panther Connect session on October 23, 2026. Original English descriptions are retained; category counts are 33 / 41 / 36 / 18. `docs/sources/path-details.json` and `docs/source-catalog.json` retain the capture. Import a new authorized capture with `node scripts/import-source.mjs <capture.json>`.

The refresh button and the daily 13:00 UTC Vercel Cron really fetch `https://fiu.campuslabs.com/engage/events.rss`. They refresh known event IDs and exact catalog-title matches, preserving original English feed descriptions. A title match alone is not official Honors credit and is excluded from recommendations until verified. The public feed is a rolling window, not the signed-in pathway directory; it cannot refresh the full authenticated catalog. Missing feed entries are not cancellations. Refresh failures retain the last verified snapshot and show a failure; the last successful refresh time is displayed publicly.

Seed events contain five verified future events and four historical events. Finance workshop duplicates are merged. A cross-category event can count toward one remaining eligible option, once. Official deadline: April 9, 2027 at 23:59 (source labels EST). Twenty service hours are separate and must be recorded in GivePulse.

Unknown registration deadlines stay unknown. Each user can enter a verified personal deadline after checking the official page; it stays private and participates in five-calendar-day reminders. All wall-clock inputs use New York time, including DST validation.

## Reminder review mode

The daily job prepares weekly drafts on Mondays and reminders five New York calendar days before known deadlines. Optional event-start reminders are separately labeled. Completed/dismissed items, duplicate aliases, expired events and full categories are excluded separately for each user. New drafts follow the account language. Saved draft previews are regenerated in the current UI language and progress; stored source drafts are not modified by viewing them.

Activity reminders remain draft-only: complete previews and `.eml` downloads, with no unattended sending provider. The user's standing preference requires reviewing each recipient, subject, body and attachment/link list before explicit confirmation to send that email. Authentication codes use Neon's managed delivery only when a human requests one.

The app does not log into FIU, copy FIU credentials, RSVP or submit official experiences. Reporting stays in Panther Connect/GivePulse. See `docs/verification.md` for the verification ledger.
