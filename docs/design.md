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

Warm paper page #f6f5f1 with white cards and hairline #e3e0d8 borders; navy #081f3d; gold #b99550 (deep #8b661f on text); gray text #697386; category accents green/blue/gold/purple. Instrument Serif for the display voice (h1, h2, date numerals, progress counts; Chinese headings fall back to the bold sans) and Inter for UI, both self-hosted via next/font; 36px primary heading, 24px section heading, 18px row title, 15px body, 14px metadata. Sidebar 240px at 1505px reference width; main padding 36px. Outline icons; 8px controls, 10px cards, 16px dialogs. The progress total is a navy block with a gold serif count. No photographs; gradients are limited to the sidebar's ambient light and grain, the navy total block, the gold track and the primary button. Necessary extensions: authentication form, editable detail dialog, empty/error states, data import/export and reminder drafts use the same tokens.

## Motion

Operate mode: motion explains state and continuity, never waits. GSAP (gsap + @gsap/react, SplitText, Flip; `lib/motion.ts` registers plugins and owns the dialog hook; the official greensock/gsap-skills live in `.claude/skills/`) drives the choreography, CSS keeps hover, press and focus feedback. One authored entrance timeline on load: brand and nav settle in, the heading reveals word by word from behind masks (characters in Chinese), the progress band and its cells rise, gold tracks fill from zero, then rows stagger up. Progress numbers roll between values with a brief gold wash on the cell that changed. Filter changes use Flip so surviving rows glide to their new slot while new rows fade in. Page switches use the View Transitions API: the section crossfades and rises while the gold nav indicator slides between items. Dialogs open as a staged timeline (panel, then content) and reverse before unmounting. The week grid slides in the direction of travel. Easing power3.out / power4.out; 150-450 ms for state, up to 900 ms inside the entrance only. prefers-reduced-motion skips every GSAP sequence and collapses CSS transitions to instant.
