# Verification and design ledger

## Executed checks

- November 2 Paths re-read: the owner pasted the full four-category list from the signed-in Paths page (132 items). Diff against the October 23 capture: four options added (Teach the Truth Tour to Rosewood, STEM Faculty Panel & Brunch, S.T.I.C.H Halloween spooky night, Halloween Party (Green Campus Initiative)), none removed. The four are stored as event-type options without official descriptions. The public feed carries "STEM Faculty Panel & Brunch" on November 16, 2026 with six host organizations; the parser previously dropped multi-host entries' host names and now keeps all of them. The Paths-checklist home view was reverted; the event list is the default again.

- November 1 option-rule matching: feed entries are now attributed by each pathway option's own rule, not only by exact title. An "X Events" option matches entries whose host organization is X (diacritics, "the", "and" and "FIU" ignored, parenthetical suffixes dropped); four Honors College series (Honors Hours, Study Abroad Instagram Lives, Career Essentials / Career Cookies, Colloquium) match by title when the host is the Honors College. Rule matches are verified with a note naming the option; events the rules do not cover are still dropped. Live probe: 19 attributed upcoming events versus 2 before. 25 Node tests pass, including rule hits, non-hits and draft inclusion. Headless Chrome with a mocked /api/events response rendered all 19 rows with category chips and the option note in details; no console errors; no database writes.

- November 1 host-matching trial, reverted: keeping every public-feed entry hosted by FIU Honors College surfaced 11 events (Course Showcase, Career Essentials, Study Abroad sessions) that do not appear anywhere on the Paths directory, because Paths lists options, never events, and gives no event-to-option mapping. Decision: an event whose Honors credit cannot be confirmed is not shown at all. The matcher is back to known IDs and exact catalog titles; the 11 rows written to the live events table were removed, and the loader now ignores any row without option attribution. Kept from the trial: feed text decodes HTML entities and drops the repeated title block, and the "verified upcoming events" count excludes unverified matches.

- October 25 multi-account release: 23 Node tests cover verified-user admission, OTP input boundaries, per-account recipient/language validation, bilingual dates/descriptions/reminders and progress rules. TypeScript and production build pass. Real Neon checks with two disposable user IDs and two connections prove independent records, notes, hours, languages, recipients and drafts, as well as stale-write conflicts; all QA rows are removed.
- Local Chrome QA: English activities, all 128 options, details, week view, progress and reminder screens contain no Chinese interface text. English survives reload. Intercepted OTP/session responses exercise send → six-digit entry → account load without a password, resend cooldown, independent A/B progress and restoration of B’s cloud language. Selecting A’s saved draft in tab 1, then signing out in tab 2, clears A’s recipient and disables draft download in tab 1. These success-flow checks are mocked; they do not send authentication emails or create real Auth users. The real auth smoke check reaches Neon’s invalid-code validation for a non-owner email and rejects malformed delivery, cross-origin requests and password routes.
- Review found and fixed stale private draft state, late preference/import responses borrowing a new identity, and cross-tab stale private views. Account-scoped component keys, request/account guards, cross-tab broadcasts and focus session revalidation address these. Final reviewer reported no remaining important findings.
- Live source audit on October 25 returned HTTP 200 with 392 RSS entries and 4 matched known events. The shared sync log recorded success at 13:58 UTC. Refresh retains the signed-in directory snapshot boundary and uses no runtime translation model.

- OTP follow-up: the actual Neon email uses a six-digit code, so the form now provides verification, manual resumption and explicit resend instead of link-only instructions. Local Chrome checks with intercepted auth responses verified signup → OTP form, resend, verification → password-login fallback and manual resumption with the email retained. Those checks did not use the owner's code or deliver email. Real local API checks confirmed that non-owner verification and delivery requests return 403; the auth smoke check failed before this guard and passed after it. Actual owner verification remains a user action.

- Registration incident, October 23: anonymous auth GETs passed but auth POSTs returned `403 INVALID_ORIGIN`. Added the exact production origin to the main branch's Neon Auth trusted domains and enabled Verify at Sign-up to match the server's verified-email requirement. `scripts/check-auth.mjs` reproduced the failure before the change and passed afterward: invalid sign-in 401, too-short owner signup 400, non-owner signup 403. It creates no account and sends no email. The client now displays SDK authentication errors instead of disguising them as network outages; local browser reproduction displayed the actual `Invalid origin` message.

- All 128 directory options imported, with 128 Chinese summaries and four category counts 33 / 41 / 36 / 18. Original source descriptions are retained.
- Seventeen Node tests pass: caps and duplicate credit, aliases/dismissals, protected quick toggles, event attribution, backup validation, malformed dates, New York DST, five-day reminder selection, unknown deadlines, RSS trust boundaries, unverified credit exclusion and selection of the remaining eligible option for cross-category events.
- TypeScript and production Next.js build pass.
- Real Neon integration check uses two independent connections: durable saved data, initial preferences revision, stale-write conflict, preference preservation and owner scoping. Its temporary QA rows are removed.
- Anonymous GET state returns no private records; anonymous write is 401, cross-origin write is 403, unauthenticated cron is 401.
- Authorized local cron returns 200, updates four known events from the official public feed, and reports zero emails sent.
- The same production checks pass on https://fiu-honors-planner.vercel.app: anonymous state has no private records, writes reject with 401/403, cron rejects unauthorized calls, and an authorized production refresh updates four events with emailsSent=0. Runtime error/fatal log inspection found no matching errors at handoff.
- Browser extension interaction checks: all 128 options, Advisor search returning four matching options, details, the next week containing three verified events, full weekly draft and mobile layout with no horizontal overflow.
- Chrome extension screenshot resizing was unreliable, so final visual comparison uses independent headless Chrome through the installed agent-browser CLI. Temporary QA session is closed after use.

## Design comparison

Reference: design.png, 1505×1045. Actual desktop screenshot captured at the same size; mobile at 390×844. Both inspected through view_image.

| Element | Reference / implementation | Result |
| --- | --- | --- |
| Navigation | Navy rail, FIU text mark, gold selected indicator and three named destinations | Preserved; mobile converts to top navigation |
| Palette | True white surface, #081f3d navy, muted gray borders, restrained gold | Preserved; no decorative gradients or image overlays |
| Typography | Large Chinese heading, readable English event titles, secondary summaries and metadata | Preserved using native fonts; long official titles wrap naturally |
| Structure | Four progress columns followed by filters and horizontal dated activity rows | Preserved; official-acceptance counts added to clarify status |
| Row anatomy | Date rail, category, title, summary, times/location, deadline, bookmark/details | Preserved; actual verified source information replaces illustrative rows |
| Native controls | Search, selects, buttons, dialogs, date input and optional verified deadline | Implemented as accessible HTML; keyboard focus and reduced motion supported |
| Responsive behavior | Same system extended to a narrow display | No horizontal overflow; actions and details remain reachable by scrolling |

Above-fold copy differences are intentional functional extensions: verified activity count, school-recognized subtotals, recommendation checkbox and sign-in/sync status. Scheduled events are chronological; self-arranged options have their own filter. The total is labeled 已参加 instead of the concept's 已完成 to avoid implying school recognition. The source refresh control and snapshot-age copy distinguish daily public-feed updates from the authenticated directory snapshot. The generated concept remains the layout/style reference; these changes preserve the required real-data workflow.

## Independent review repairs

All actionable review findings addressed: preference revision initialization; shared canonical-aware eligibility in UI and drafts; no bookmark downgrade of attended/accepted records; time filtering in week view; exact item/event ownership validation; safe user-confirmed backup restore. Reproduction tests and the real database check cover these changes.

## Practical limits

Personal signup/password entry and email verification are performed by the owner. Database persistence and authorization rejection have been verified independently; no owner password or FIU credential is read by the agent. The app never submits experiences to FIU. Email remains draft-only with no sender connected. Public RSS refresh cannot fetch the private pathway catalog, and feed omission is not proof of cancellation. Unknown registration deadlines remain unknown; the owner can add a deadline after verifying it on the linked page.
