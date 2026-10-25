# Shared planner, independent accounts, English and Chinese

Goal: Any person signs in with an emailed six-digit code, keeps independent progress in the four existing official categories, and returns to their saved English or Chinese interface.

Keep Next.js, Neon Auth, existing database rows and Vercel. Reuse the existing user_id ownership boundary; no new provider, password form, custom categories or runtime translation service. Existing owner records remain under the same Neon user ID. All application emails remain reviewable drafts; authentication codes are requested explicitly by the user.

- [ ] Add checks for verified-session admission, language validation, two-user isolation, bilingual dates/reminders and original English descriptions.
- [ ] Replace owner-only/password routes with validated same-origin email OTP send/sign-in and sign-out. Keep the provider's throttling and add a resend delay in the form.
- [ ] Persist language in each user's JSON preferences; use browser storage before login, restore the account preference after login, and clear private client state when identities change.
- [ ] Translate all interface labels, dates, messages and new reminder drafts. Use original English descriptions in English mode and existing curated summaries in Chinese mode.
- [ ] Keep the refresh source and matching boundary explicit. Preserve English RSS descriptions and show the last refresh result and time.
- [ ] Run unit, database and browser checks, including independent user rows, language restoration, mocked OTP flows and real rejection of malformed/anonymous requests. Push and verify the exact Vercel production commit. Leave real OTP entry to the user.

Public RSS is a rolling feed, not the authenticated Honors pathway catalog. A title match alone does not establish official credit. Missing feed entries are not cancellations. No source or authentication failures may be presented as successful refreshes/logins.
