# FIU Honors Planner Implementation Plan

> Execute inline with superpowers:executing-plans and a final independent review.

**Goal:** Deliver the approved personal Honors activity planner, synced through Neon, in a desktop folder, private GitHub and Vercel.
**Architecture:** A Next.js app with source JSON, a small Neon persistence layer, session-protected APIs and a daily preparation job. Recommendation logic is shared by the UI and reminder drafts.
**Tech Stack:** Next.js, React, Neon serverless SQL, Neon Auth, native CSS, Node test runner.
**Spec:** design.md and design.png.

## Global constraints

Preserve 128 source options. No FIU credentials copied. No outgoing email without individual confirmation. Neon free plan only. Keep existing projects untouched.

## Review focus

Duplicate source rows/events count once; canceled/expired items stay out of recommendations; unknown dates never acquire invented times; unauthorized API requests cannot access progress; failed saves retain editable local UI without falsely claiming synchronization.

## Tasks

- [ ] Data and logic: normalize source data, add Chinese descriptions, verified dates and source links. Write Node assertions first for category caps, event deduplication, date/deadline selection, timezone/DST and input validation; run red then green.
- [ ] Persistence and auth: use provisioned Neon Auth, owner-only server checks, parameterized SQL, item-level upserts and optimistic revision conflicts. Verify anonymous rejection and independent-session persistence.
- [ ] Interface: build shell, list/search/filters, week view, details with plans/attendance/official status, progress, volunteer hours, settings and safe JSON import/export. Verify desktop/mobile interactions against design.png.
- [ ] Refresh and draft preparation: read official public feeds with timeouts; prepare weekly and five-day reminders with unique keys; show failure/staleness; provide full reviewable email preview and .eml download. Never send.
- [ ] Delivery: test, typecheck, build, independent review and browser QA; commit and push private repository; deploy and verify Vercel production URL. Keep only useful source and documentation in Git.
