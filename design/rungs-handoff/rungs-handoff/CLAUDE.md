# Rungs: build brief for Claude Code

Rungs is a HackOHI/O 2026 entry for the Bridge Builder Challenge (Honda Research Institute × 99P Labs at Ohio State). It connects OSU students, industry mentors and recruiters around **verified real work**, not polished resumes.

Your job: build the frontend in `app/` exactly as designed in `design/`, with mock data behind a clean API layer so the backend team can plug in later.

## 1. The design files are the source of truth

`design/` holds the final design. Each `.dc.html` file is a complete, interactive mockup of one persona:

| File | Persona | Tabs |
|---|---|---|
| `design/student.dc.html` | Student (Sam Okafor) | Overview · Plan · Events · Network · Resume |
| `design/mentor.dc.html` | Mentor (Rina Matsuda, HRI) | Project feed · Find students · My profile |
| `design/recruiter.dc.html` | Recruiter (Jamie Cole, 99P Labs) | Find students · Invites · My profile |
| `design/build-spec.dc.html` | — | Colors, type, spacing, the 10 components with their Tailwind classes, scoring formulas |

How to read them (they are NOT React):
- Markup sits inside `<x-dc>…</x-dc>` with inline styles. Treat the inline styles as the exact visual spec, then express them as Tailwind classes (the build spec maps most of them for you).
- `{{name}}` is a value computed in the `renderVals()` method at the bottom of the file.
- `<sc-for list="{{items}}" as="item">` is a `.map()`. `<sc-if value="{{cond}}">` is a conditional render.
- **All sample data lives in `renderVals()`**: students, projects, events, people, resume feedback, credibility numbers. Move it into `app/src/api/mockData.js` unchanged.
- Ignore `<helmet>`, `support.js`, `data-props` and `$preview`. They belong to the design tool.

Match the design closely: spacing, sizes, colors, copy and the order of elements. If something in the design seems wrong, ask before changing it. Don't add features, sections or copy that aren't in the design.

## 2. Stack

- Vite + React 18 (JavaScript, not TypeScript) + Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react` + `react-router-dom`
- Inter from Google Fonts (400/500/600/700). Default Tailwind colors only, no custom config.
- Light theme only. Page column: `max-w-[832px] mx-auto px-6`.
- Every interactive control is at least 44px tall (`h-11` / `min-h-11`). Real `<button>`, `<label>`, `<input>` elements, plus `aria-label` on icon-only buttons and `aria-pressed` on chips.

## 3. Structure (two beginner frontend devs will own these files)

```
app/src/
  main.jsx, App.jsx            routes + shared store provider
  store/AppStore.jsx           React context: shared state across personas (see §5)
  api/client.js                the ONLY place that fetches data; async mock functions now
  api/mockData.js              all sample data copied from design/*.dc.html renderVals()
  api/scoring.js               mentorWeight, overall, credibility, network ranking (build spec #10)
  components/ui/               Button, Chip, Tag, Card, Panel, DisclosureRow, StarRating,
                               TierBar, Tabs, Modal, Avatar, SearchInput, VerificationTracker
  components/Header.jsx        logo + Student/Mentor/Recruiter switcher + tab row
  pages/student/  Overview.jsx Plan.jsx Events.jsx Network.jsx Resume.jsx ExplainScoreModal.jsx
  pages/mentor/   Feed.jsx ProjectCard.jsx FindStudents.jsx Profile.jsx
  pages/recruiter/ FindStudents.jsx Invites.jsx Profile.jsx
```

Routes: `/student/:tab`, `/mentor/:tab`, `/recruiter/:tab`. `/` redirects to `/student/overview`. The persona switcher and the tab row are links, so the browser back button works.

Every function in `client.js` is `async`, returns plain JSON, and has a comment above it naming the REST endpoint it will become (e.g. `// GET /api/students/search?q=&role=&verified=`). Components never import `mockData.js` directly.

## 4. Behaviors that must work

**Student**
- Overview: the "Explain my score" button opens a modal with + and − bullets for each of the 4 dimensions (data is in `renderVals()`). The modal closes on Esc, the × button, or a click on the backdrop. "Close it · Nh" jumps to the Plan tab.
- Plan: pick a start time, then Commit. The card becomes the green "If it's Saturday at 10 AM, I'll be at…" sentence.
- Events: the filter chips work, and Save toggles. Show the "Scanned 12 min ago" source strip. The data is mock for now; `client.getEvents()` is where the backend's scraper/feeds plug in.
- Network: the filter chips work, "How credibility works" expands, and each action button flips to "Sent".
- Resume: the role chips switch the feedback list. There is **no** rewrite, apply or "fix it for me" control anywhere. This is deliberate: AI never rewrites the resume.

**Mentor**
- Feed: the filter chips work, and the feed is sorted with fewest verified reviews first.
- Every score, the AI rating, the mentor rating, skill breakdown and mentor quotes are always visible. Nothing is locked.
- Rating is optional: a mentor can submit stars only, a note only, or both. Clicking the same star again clears it. "Leave feedback" opens the composer, which has sentence starters, a 140-character limit and an endorse checkbox.
- Submit for verification → a 4-step tracker (Submitted → Quality check → Peer confirm → Published), plus a "Once verified: rating X → Y" line and a Withdraw button. **A pending review never changes any score and is never shown to the student.**
- Find students: search, checkbox filters and invite-to-office-hours all work.
- My profile shows the credibility breakdown.

**Recruiter**
- Find students: live text search over name, project and skills; role chips; "Mentor-verified only" and "Clears my 70% bar" filters; sort by best match or fastest growing. Invite flips to "Invited" and adds the student to the Invites tab as "Waiting".

## 5. Cross-persona demo loop (most important for the pitch)

Keep shared state in `AppStore` so this works end to end with no reload:

1. On the Mentor feed, rate Sam Okafor's "Split ergonomic keyboard case" 5★, write a note, and submit. It shows as pending.
2. Add a small, clearly labelled **"Demo: verify now"** button on the pending tracker. It completes the remaining steps, standing in for the backend's AI check plus a second mentor.
3. Once verified: Sam's project rating updates in the feed (72 → 79 using `scoring.js`), and the review appears in "What mentors wrote". On the Student side, Overview shows the review card, the score goes 56 → 65, and a notification dot appears on the bell.
4. On the Recruiter side, Find students → invite Sam. Sam gets a notification, and the invite shows in Recruiter → Invites.

Before verification, the student's Overview shows the pre-review state: score 56 and no review card. The current design file shows the post-review state, so build both from the same data.

## 6. Scoring (from build spec #10; put it in `api/scoring.js`)

```js
mentorWeight(n) = Math.min(0.6, n / (n + 3))          // only VERIFIED reviews count
overall(ai, stars) = stars.length ? round(ai*(1-w) + avg(stars)*20*w) : ai
feed sort: fewest verified reviews first, then AI score high → low
credibility = .35*verifiedOrReplyRate + .20*replySpeed + .15*activeDays30 + .20*outcomes + .10*studentRating
networkRank = .6*relevanceToStudentTrack + .4*credibility
```

## 7. Build order (stop after each step and tell me what to check)

1. Scaffold the Vite app in `app/`, Tailwind v4, Inter, the routes, Header with the persona switcher and tab row, and empty pages.
2. The `components/ui/` set from the build spec, plus `mockData.js` copied from the design files, `client.js` and `scoring.js`.
3. Mentor Project feed (the most complex page), matching `design/mentor.dc.html`.
4. Student tabs, one at a time, including the Explain-score modal.
5. Mentor Find students and Profile; all Recruiter tabs.
6. `AppStore` and the demo loop in §5.
7. Responsive pass at 390px wide (cards stack, chips wrap, no horizontal scroll), an accessibility pass, `npm run build` with zero errors, and a short README covering how to run the app and the API endpoint list from `client.js`.

## 8. Don'ts

- Don't add a dark mode, new colors, gradients, emoji, or a component library (shadcn, MUI and the like).
- Don't put `fetch()` in components.
- Don't rename people, numbers or copy from the design.
- Don't make anything that rewrites or "optimizes" the resume text.
