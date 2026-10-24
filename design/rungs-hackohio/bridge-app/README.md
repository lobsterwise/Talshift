# Rungs · OSU × Industry

Two-way AI skill-diagnostic, action-planning, peer-comparison and mentor/recruiter verification platform.
HackOHI/O 2026 · Bridge Builder Challenge (Honda Research Institute × 99P Labs).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # clicks through the full 5-step demo automatically
npm run build      # production build in dist/
```

Stack: React 18 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react`.
No `tailwind.config.js` is needed with v4; styles start from `src/index.css`.

## Who owns what

| File | Owner | What it is |
|---|---|---|
| `src/components/ProfileTab.jsx` | Frontend dev A | Resume/GitHub upload, role picker, Standardized Rating, Recruiter Checklist, parsed data model |
| `src/components/ActionPlanTab.jsx` | Frontend dev A | Weekend / Week / Month plan, if-then commit modal, office-hour talking points |
| `src/components/CommunityCompareTab.jsx` | Frontend dev B | Tale of the Tape, AI mutual-growth advice, team-up, leaderboard |
| `src/components/MentorRecruiterPortal.jsx` | Frontend dev B | Mentor 90-second review + office hours; Recruiter rubric, filters, two-way invite |
| `src/components/ui.jsx` | Shared | Card, Badge, Button, ProgressBar, ScoreRing, Stars, Modal, Segmented, Toast |
| `src/App.jsx` | Shared | Persona switcher, all shared state, notifications, demo guide |
| `src/api/client.js` | Backend ↔ frontend seam | Every data call. Swap mocks for `fetch()` here only |
| `src/api/mockData.js` | Backend | Sample data. Each export mirrors a table |

**Rule:** components never call `fetch()` directly. They receive data and callbacks as props from `App.jsx`, which calls `client.js`. To go live, the backend team edits `client.js` and nothing else changes.

## API contract (what `client.js` expects back)

| Function | Endpoint | Returns |
|---|---|---|
| `analyzeProfile({ resumeText, githubUrl, roleId })` | `POST /api/profile/analyze` (multipart) | `{ parsed: { skills: string[], projects: [{ name, desc, stack, teamSize, team, hasRepo, shipped }], experience: string[], leadership: number, githubUrl } }` |
| `fetchPeers()` | `GET /api/community/peers` | `PEERS` shape in `mockData.js` |
| `fetchShowcase()` | `GET /api/showcase/projects` | `SHOWCASE_PROJECTS` shape |
| `submitMentorReview(projectId, review)` | `POST /api/showcase/projects/:id/reviews` | `{ projectId, review: { mentor, stars, note, tags, endorse, seconds, at } }` |
| `commitAction(c)` | `POST /api/plan/commit` | `{ id, itemId, horizon, title, hours, ifWhen, ifWhere, at }` |
| `requestTeamUp(peerId, kind)` | `POST /api/community/team-requests` | `{ peerId, kind, status: 'sent' }` |
| `sendInvite(payload)` | `POST /api/recruiter/invites` | `{ id, studentId, from, offers, note, status }` |

Scoring (`scoreProfile`), rubric matching (`rubricFor`), the plan builder (`buildPlan`) and peer comparison (`compareProfiles`) are pure functions in `client.js`. The backend can move them server-side and return the same shapes, or the frontend can keep running them on the parsed data.

Set `VITE_API_BASE` in a `.env` file if the API isn't at `/api`. `vite.config.js` proxies `/api` to `http://localhost:8000` in dev.

## 3-minute demo script

The floating **Demo flow** panel (bottom-right) tracks these and jumps to each screen.

1. **Student View → Profile & Score.** Click *Analyze my real work*. Show score **55**, the 4 bars with next-tier markers, the checklist at **5/8 proven** with "1 more proof to clear the bar", and the JSON data model toggle. Switch role chips to show the rubric re-score instantly.
2. **Action Plan.** Show the *Kalman Filter Tracker in a Day* challenge, Handshake events, the 15-min Honda office hours (open AI talking points) and the 99P Labs 5-week project. Click **Commit** and read the if-then sentence aloud.
3. **Compare & Team.** Maya Chen is the top complementary match. Walk the mirrored bars and "You bring / They bring", then **Team up**. She accepts in about 2 seconds and the bell lights up. Scroll to the leaderboard: you're **#9**, "Near me" view.
4. **Mentor View.** Rina Matsuda reviews *Buckeye Rover Lane Perception*: 5★, tick **Endorse**, click a sentence starter, **Submit**. Panel shows **55 → 65** and the timer under 90 s.
5. **Recruiter View.** Jordan now shows **Newly verified** and clears the rubric. Click **Invite**, keep both offers, **Send Two-Way Fast-Track Invite**. The *Student View* tab shows a red badge. Switch back: green banner, bell, **Accept**. On Compare & Team the leaderboard shows **▲2 since your mentor review**.

All people, companies' event listings and dates are sample data for the demo.
