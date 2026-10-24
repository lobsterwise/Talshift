# Frontend team plan

Two people build the frontend in `frontend/` from the designs in `design/`. `CLAUDE.md` is the build brief; this file is who does what and how we share work.

- **Person A: Ishan.** Foundation, the API layer, the Professional pages, and the shared store.
- **Person B: teammate.** UI components and the Student pages.

You don't need PostgreSQL or the backend for any of this. The frontend uses mock data.

---

## The golden rules

1. **Never commit on `main`.** Make a new branch for every task.
2. **Pull before you start.** Every time you sit down, run `git switch main` then `git pull`.
3. **Only edit your own files.** See the ownership table below. If you need to change someone else's file, message them first.
4. **Small and often.** Merge a branch as soon as one tab works. Don't sit on a branch for a whole day.
5. **Check before you merge.** Run `npm run build` inside `frontend/`. It must finish with no errors.

## Who owns which files

| Files | Owner |
|---|---|
| `package.json`, `package-lock.json`, `vite.config.ts`, `App.tsx`, `main.tsx`, `index.css`, `personas.tsx` (tabs and routes), `components/Header.tsx` | A |
| `api/` (`types.ts`, `mockData.ts`, `client.ts`, `scoring.ts`), `store/AppStore.tsx` | A |
| `components/ui/` | B |
| `pages/professional/` | A |
| `pages/student/` | B |

If you need a new client function or piece of mock data, ask A. If you need a UI component changed, ask B.

---

## One-time setup

### Person B (on your own computer)

1. Install these:
   - **Git**: https://git-scm.com (on Windows, accept the defaults).
   - **Node.js 22 LTS**: https://nodejs.org.
   - **VS Code** and the **Claude Code** extension.
2. Ask the repo owner (`lobsterwise`) to add your GitHub account as a collaborator: repo → Settings → Collaborators. Accept the email invite.
3. Open a terminal in the folder where you keep projects and run:
   ```sh
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   git clone https://github.com/lobsterwise/Talshift.git
   cd Talshift/frontend
   npm install
   npm run dev
   ```
   Open the URL it prints. A blank page is correct for now.
4. In VS Code, open the `Talshift` folder. Open the `.dc.html` files in `design/` in your browser to see what we're building. Start with `student.dc.html`, because that's yours.

### Person A

Merge the setup branch and push it, so `CLAUDE.md`, `TEAM.md` and `design/` are on GitHub before B clones.

---

## The everyday routine (both of you)

```sh
# 1. Start from the latest main
git switch main
git pull

# 2. Make a branch for this task
git switch -c b/student-plan        # use a/... or b/... plus a short task name

# 3. Build it (ask Claude, check it in the browser with npm run dev)

# 4. Save and upload
cd frontend && npm run build && cd ..   # must pass
git add .
git commit -m "Student Plan tab"
git push -u origin b/student-plan
```

Then on GitHub, click **Compare & pull request**, then **Create pull request**. Tell the other person. They look at it, then click **Merge pull request**. Then both of you run `git switch main` and `git pull`.

**If `git pull` or a merge says CONFLICT:** don't panic, and don't delete anything. Ask Claude: "I have a merge conflict, help me resolve it", or ask your teammate.

---

## The plan, in order

### Step 1: Scaffold (A only, about 45 min)

**A**, on branch `a/scaffold`, asks Claude:
> Do build step 1 from CLAUDE.md. Also install every dependency we'll need for the whole project now, so nobody else has to touch package.json.

When it's done, open a pull request and merge it. Then tell B.

**B**, while waiting: finish setup, then read through `design/student.dc.html` and `design/build-spec.dc.html` in the browser. Click every button in the Student design and write down what each one does.

### Step 2: Foundation (both, in parallel)

Both of you start from the merged scaffold (`git switch main` then `git pull`).

**A**, on branch `a/api`:
> Do the API part of build step 2 from CLAUDE.md: `types.ts`, `mockData.ts` (all three design files), `client.ts` with every function the pages will need, and `scoring.ts`. Don't touch components/ui/.

**B**, on branch `b/ui`:
> Do the components/ui/ part of build step 2 from CLAUDE.md, matching design/build-spec.dc.html. Only create files in components/ui/.

Merge both. From now on you mostly work in separate folders.

### Step 3: Pages (both, in parallel, one branch per tab)

**A**, in this order, one pull request each:
1. Project feed + `ProjectCard` (the hardest page; from `mentor.dc.html`)
2. Find students (from `recruiter.dc.html`)
3. Invites (from `recruiter.dc.html`)
4. My profile (from `mentor.dc.html`)

**B**, in this order, one pull request each:
1. Student Overview + Explain-score modal
2. Plan
3. Events
4. Network
5. Resume

What to ask Claude for each tab (swap in the tab name):
> Build pages/student/Plan.tsx to match the Plan tab in design/student.dc.html, including the behaviors in CLAUDE.md §4. Only edit files in pages/student/. Get data from api/client.ts.

Check it in the browser next to the design file before you merge.

### Step 4: Demo loop (together)

This is the most important part for the pitch (CLAUDE.md §5). A builds `store/AppStore.tsx` and the Professional side. B connects Student Overview to the store: the score changing from 56 to 65, the review card, and the bell dot. Sit together, or share a screen, and test the whole loop end to end:
Professional rates Sam → Demo: verify now → Student score updates → Professional invites Sam.

### Step 5: Polish (split)

- **A:** run `npm run build` and `npm run lint`, and add the API endpoint list to `README.md`.
- **B:** check every page at 390px wide (browser dev tools → phone size) and fix anything that overflows.

---

## Tips for working with Claude

- Always name the files it may touch ("only edit pages/student/").
- Do one tab per conversation. When the tab is done, commit, then start a fresh chat for the next one.
- If something looks different from the design, tell Claude exactly what's different, for example: "the chips are 32px tall, the design shows 44px".
- Don't let it change `CLAUDE.md`, `TEAM.md`, or another person's files without asking each other first.
