# FIU Honors Planner

**English** · [中文](#中文说明)

A bilingual (English / 中文) planner for the FIU Honors College 2026–2027 engagement pathway. It keeps all 128 official pathway options in one place, shows the verified upcoming events behind them, tracks your own progress toward "two experiences in each of four categories," and prepares weekly and deadline reminder emails for you to review.

**Live site: <https://fiu-honors-planner.vercel.app/>**

![FIU Honors Planner — activities list with the four-category progress band](docs/preview.png)

## What it does

- **All 128 official options, four categories.** Academic & Research, Career Development, Personal & Social Wellness, and Honors College Week, captured from the authorized Panther Connect pathway on October 23, 2026. Each option keeps its official English description, a curated Chinese summary, and a link to the official page.
- **Verified events, not guesses.** Scheduled events are separated from self-reported experiences, undated opportunities, and recurring series. Every event shows its New York time, weekday, location, and an explicitly *unknown* registration deadline when the source does not publish one.
- **Personal progress, privately synced.** Sign in with a six-digit email code; no password. Each account stores its own planned / attended / officially accepted records, notes, verified deadlines, volunteer hours, and language preference in the cloud, so you can continue on any device.
- **Smart recommendations.** The list defaults to activities that still count for a category you have not finished. One event never counts twice, and a cross-category event only fills one remaining slot.
- **Week view.** A seven-day calendar of the filtered events, with previous / next week navigation.
- **Reminder previews, never auto-sent.** A weekly digest of the next seven days and reminders five calendar days before a known registration deadline. You see the full recipient, subject and body, and can download an `.eml` draft. Nothing is sent without you.
- **Honest data freshness.** The public FIU events feed is refreshed daily and on demand; the last successful refresh time is always shown. The signed-in pathway directory is a dated snapshot and is labeled as such.
- **Bilingual interface.** Guests start in English; the header switches between English and Chinese, and signed-in accounts remember their choice.

## How to use it

1. **Open the site** at <https://fiu-honors-planner.vercel.app/>. You can browse all activities without signing in.
2. **Browse and filter.** Use the search box, the category selector and the time filter (upcoming, all 128 options, self-scheduled experiences, undated, past). Switch between list view and week view. Click a progress column at the top to jump straight to that category.
3. **Sign in to save progress.** Open *Account & settings*, enter your email, and type the six-digit code you receive. The first successful code creates your account.
4. **Plan and record.** Click the bookmark on a row to mark it as planned, or open *View details* to set the status (planned, attended, officially accepted, not interested), the attendance date, a verified registration deadline, and notes. Everything syncs to your account.
5. **Track the four categories.** The progress band shows attended and officially accepted counts per category and your total out of 8. *My progress* lists your records and lets you log the separate 20 annual volunteer service hours.
6. **Review reminders.** *Email previews* shows the weekly digest and the five-day deadline reminders generated for your progress and language. Adjust reminder preferences in settings and download a draft when you want to send one yourself.
7. **Back up.** Export your records as JSON from *My progress* or settings, and restore them later from the same account.

Official reporting still happens in Panther Connect and GivePulse. The planner never logs into FIU, stores FIU credentials, RSVPs, or submits experiences on your behalf.

## Run it locally

Production uses Node 24. The app is Next.js 16 on Vercel with Neon Postgres and managed Neon Auth.

```sh
npm ci
vercel link
vercel env pull .env.local
npm run dev
```

Required server variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `CRON_SECRET`. Keep them in the ignored `.env.local` and in encrypted Vercel environment variables. The production origin must stay trusted in Neon Auth; sign-in uses managed Email OTP only, and password routes are disabled.

### Verify

```sh
npm test
npm run typecheck
npm run build
node --env-file=.env.local scripts/check-db.mjs
node scripts/check-auth.mjs http://localhost:3000
```

The database check uses disposable user IDs and removes its rows. The auth smoke check never sends email or creates an account. See `docs/verification.md` for the verification ledger.

### Data and refresh

- `data/items.json` holds the 128 options (33 / 41 / 36 / 18 per category) with original descriptions. `docs/sources/` keeps the capture. Import a new authorized capture with `node scripts/import-source.mjs <capture.json>`.
- The refresh button and the daily 13:00 UTC Vercel Cron fetch `https://fiu.campuslabs.com/engage/events.rss`, update known event IDs and exact catalog-title matches, and keep the last verified snapshot on failure. A title match alone is not Honors credit until verified.
- Official pathway deadline: April 9, 2027 at 23:59 (the source labels it EST). All wall-clock values use America/New_York, including DST validation.

### Privacy and account boundaries

All private reads and writes are scoped to the authenticated, verified Neon user ID. Clients cannot choose a data owner or reminder recipient, writes carry the displayed account email so a stale tab cannot save into another account, and sign-out clears private state across tabs. No runtime LLM or translation API is called.

### Design

Navy sidebar, white surface, gold accent, Inter with Chinese fallbacks. Motion is purposeful: one authored entrance, View Transitions between pages, and layered hover / press feedback, all collapsing to instant under `prefers-reduced-motion`. Details in `docs/design.md`.

---

## 中文说明

[English](#fiu-honors-planner) · **中文**

面向 FIU Honors College 2026–2027 参与路径（engagement pathway）的中英双语规划工具。它把全部 128 个官方选项放在一处，展示背后已核实的未来活动，跟踪你在"四个分类、每类两项经历"上的个人进度，并为你准备每周与截止日提醒邮件的预览。

**网站：<https://fiu-honors-planner.vercel.app/>**

### 功能

- **128 个官方选项，四个分类。** 学术与研究、职业发展、身心与社交、Honors College Week，来自 2026 年 10 月 23 日对 Panther Connect 路径的授权读取。每个选项保留官方英文说明、整理好的中文摘要和官方页面链接。
- **只展示已核实的活动。** 具体排期的活动与自行安排的经历、尚未公布日期的机会、系列活动分开显示。每场活动都标明纽约时间、星期、地点；官方未公布报名截止时会明确写"官方未公布"，不做猜测。
- **私人进度云端同步。** 通过邮箱六位验证码登录，无需密码。每个账号独立保存计划 / 已参加 / 学校已认可的记录、备注、已核实的截止时间、志愿服务小时和语言偏好，换设备登录即可继续。
- **智能推荐。** 列表默认只显示仍能计入未完成分类的活动。一场活动不会重复计数，跨分类活动只填补一个剩余名额。
- **周视图。** 按七天查看筛选后的活动，可切换上一周 / 下一周。
- **提醒预览，绝不自动发送。** 未来 7 天清单，以及已知报名截止前 5 个日历日的提醒。你可以看到完整的收件人、主题和正文，并下载 `.eml` 草稿；没有你的确认，不会发送任何邮件。
- **诚实的数据时效。** FIU 公开活动源每日刷新并支持手动刷新，始终显示最近一次成功刷新时间；需要登录的路径目录是带日期的快照，并如实标注。
- **双语界面。** 访客默认英文，页眉可随时切换中英文，登录账号会记住你的选择。

### 使用方法

1. **打开网站** <https://fiu-honors-planner.vercel.app/>，不登录也可以浏览全部活动。
2. **浏览与筛选。** 使用搜索框、分类选择和时间筛选（未来活动、全部 128 个选项、自行安排的经历、日期待公布、已结束）。可在列表视图和周视图之间切换；点击顶部任一进度列可直接跳到该分类。
3. **登录以保存进度。** 打开"同步与设置"，输入邮箱并填写收到的六位验证码。第一次验证成功即自动创建账号。
4. **计划与记录。** 点击活动行上的书签把它加入计划，或打开"查看详情"设置状态（计划参加、已参加、学校已认可、不感兴趣）、参加日期、已核实的报名截止和备注。所有内容都会同步到你的账号。
5. **跟踪四个分类。** 顶部进度条显示每个分类的已参加与学校已认可数量，以及 8 项中的总进度。"我的进度"列出你的记录，并可单独记录每年 20 小时的志愿服务。
6. **查看提醒。** "邮件预览"按你的进度和语言生成每周清单和 5 天提醒。可在设置中调整提醒偏好，需要时下载草稿自行发送。
7. **备份。** 在"我的进度"或设置中导出 JSON 记录，之后可在同一账号恢复。

向学校的正式上报仍需在 Panther Connect 和 GivePulse 完成。本工具不会登录 FIU 系统、不保存 FIU 凭据、不代替你 RSVP 或提交经历。

### 本地运行

生产环境使用 Node 24，技术栈为 Next.js 16 + Vercel + Neon Postgres + Neon Auth。

```sh
npm ci
vercel link
vercel env pull .env.local
npm run dev
```

服务端必需变量：`DATABASE_URL`、`NEON_AUTH_BASE_URL`、`NEON_AUTH_COOKIE_SECRET`、`CRON_SECRET`，仅保存在被忽略的 `.env.local` 和 Vercel 加密环境变量中。验证命令见上方英文部分的 *Verify*；数据来源、刷新机制、隐私边界与设计说明也以英文部分为准，设计细节见 `docs/design.md`。
