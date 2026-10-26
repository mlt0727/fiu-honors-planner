# FIU Honors Planner

Approved 2026-10-23: personal use, cross-device sync, Chinese summaries and official English titles. Desktop project, private GitHub repository, Vercel deployment, Neon database.

## Experience

Use design.png as the visual reference: navy sidebar, white main surface, gold accent, four progress columns, horizontal event rows. Navigation: 活动列表 / 我的进度 / 邮件预览. Settings controls sign-in and synchronization. On mobile, sidebar becomes a compact top navigation; rows stack without horizontal overflow.

Preserve all 128 source options in their four categories. Each category requires two elective items. Separate individual scheduled events from self-reported experiences, undated opportunities and series. Each row has a Chinese explanation, official source link, event time, location and explicitly unknown registration deadline when absent.

Personal records distinguish planned, attended and officially accepted; attended or accepted counts toward recommendation suppression, capped at two per category, while official accepted counts remain separate. Do not count one scheduled event twice across categories or duplicate source entries.

Use America/New_York consistently, including daylight saving. The source says April 9, 2027 11:59 PM EST; show its original wording alongside the local-date deadline rather than silently asserting an offset. The additional annual volunteer requirement is 20 hours and is tracked separately.

## Data and privacy

Next.js on Vercel. Neon Postgres and managed Neon Auth. All progress APIs validate the server session and owner email. Credentials stay in ignored local environment files and encrypted Vercel environment variables. Public source events contain no student progress or meeting invitation signatures. Existing sources never receive state-changing requests.

Daily Vercel Cron refreshes public official feeds where accessible and prepares pending email drafts. Private Panther Connect pathway updates require an authorized browser refresh/import; display snapshot age honestly. A feed failure preserves last verified events and records the error. Conservative matching never promises Honors credit for an unrelated event.

## Reminders

Weekly digest of the next seven days; separate registration-deadline reminders five calendar days before a known deadline. If no deadline exists, a clearly labeled event-start reminder is optional. Exclude completed categories and dismissed events. Persist drafts and deduplicate their keys. No email is sent automatically: the user's standing preference requires reviewing exact recipient, subject, body and explicit final confirmation for every email. Preview and .eml download are available immediately; a sending provider may be connected only if sending is later authorized.

## Design tokens

White background #ffffff; navy #081f3d; gold #b99550; gray text #697386; cool gray border #d8dee7; category accents green/blue/gold/purple. Inter (self-hosted via next/font) with system and Chinese fallbacks; 36px primary heading, 24px section heading, 18px row title, 15px body, 14px metadata. Sidebar 240px at 1505px reference width; main padding 36px. Outline icons, 6px button/row radius. No photographs; the only gradient is the sidebar's faint ambient light. Necessary extensions: authentication form, editable detail dialog, empty/error states, data import/export and reminder drafts use the same tokens.

## Motion

Operate mode: motion explains state and continuity, never waits. One authored entrance on load (heading blur-in, progress tracks fill from zero, rows stagger up to seven). Page switches use the View Transitions API: the section crossfades and rises while the gold nav indicator slides between items. Feedback is layered: hover lift with an offset shadow, press scale, gold date on row hover, pop on saved bookmark and total count, spinning refresh icon, dialog blur-scale entrance. Easing cubic-bezier(.16,1,.3,1); 150-400 ms for state, 700 ms for the entrance only. prefers-reduced-motion collapses every animation and transition to instant and disables view transitions.
