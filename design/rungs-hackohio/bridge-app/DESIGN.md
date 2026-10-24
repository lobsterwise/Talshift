# Rungs: UX Psychology & HCI Design Blueprint

HackOHI/O 2026 · Bridge Builder Challenge (Honda Research Institute × 99P Labs)

Each principle below names the research, the claim it supports, and the exact UI decision it drives. Where the evidence is weaker than its popular reputation, that's stated so judges can't catch us overclaiming.

---

## 1. Goal-Gradient Hypothesis (Hull, 1932) + Zeigarnik Effect (Zeigarnik, 1927)
**Recruiter Transparency Checklist · Standardized Rating bars**

**Research.** Hull observed that rats ran faster as they got closer to the food reward. Kivetz, Urminsky & Zheng (2006, *Journal of Marketing Research*) showed the same in people: coffee-card customers bought more often as they neared a free drink. Nunes & Drèze (2006, *Journal of Consumer Research*) found "endowed progress" (a card that starts partly stamped) raised completion compared with an identical goal that started at zero. Zeigarnik (1927) reported that people recall interrupted tasks better than finished ones, suggesting open loops create tension. *Caveat:* replications of the memory effect itself are mixed, so we lean on goal-gradient for the motivation claim and use Zeigarnik only for the "open loop" framing.

**UI decisions.**
- The checklist opens with what the student has **already proven** (✅). That is endowed progress: they start at 5/8, not 0/8.
- The coverage bar has a dashed marker at the recruiter's bar (70%). The copy shows the **distance** to it ("1 more proof to clear the verified bar"), not a percentage.
- Every dimension bar has a dashed **next-tier marker** and "N points to next tier", turning one far goal into a series of near goals so the gradient stays steep.
- Every ❌ row is an open loop with a one-click closure: "Close it · 6h" jumps to the matching 1-day challenge.

## 2. Implementation Intentions (Gollwitzer, 1999) + Fogg Behavior Model (Fogg, 2009)
**Weekend / Week / Month Action Engine**

**Research.** Gollwitzer (1999, *American Psychologist*) showed that "if situation X, then I'll do Y" plans increase goal attainment. A meta-analysis of 94 studies (Gollwitzer & Sheeran, 2006) found a medium-to-large effect (d ≈ 0.65). Fogg's model (Persuasive '09) says a behavior happens when **M**otivation, **A**bility and a **P**rompt converge at the same moment (B = MAP).

**UI decisions.**
- **Motivation:** every card shows "Closes: State estimation", linking the action to the exact rubric gap from Screen 1.
- **Ability:** every card shows its cost in hours or minutes (6h challenge, 15-min office hours). Work is time-boxed into horizons that match how students already think (weekend, week, month), not an unbounded to-do list.
- **Prompt:** Handshake and OSU events carry real times and places. "Commit" opens an **if-then builder** (When + Where) and saves the sentence "If it's Saturday 10:00 AM, then I'll be at Thompson Library working on…". That sentence is the implementation intention.
- Office hours ship with **AI talking points**, so the student's ability to use 15 minutes well is high and the mentor's time is respected.

## 3. Social Comparison Theory (Festinger, 1954): constructive, lateral comparison
**Tale of the Tape · Community Leaderboard**

**Research.** Festinger proposed that people evaluate their abilities by comparing themselves with **similar** others. Collins (1996, *Psychological Bulletin*) reviewed evidence that upward comparison can either inspire or deflate. Lockwood & Kunda (1997, *JPSP*) found that outstanding role models inspire when their success feels **attainable**, and demoralize when it doesn't.

**UI decisions ("co-op rivalry").**
- The leaderboard defaults to **"Near me"** (two ranks above, two below), so comparisons stay attainable. The goal-gradient cue "2 to pass Lena" names one reachable target, not "you are #9 of 400".
- There are **three boards** (Standardized, 30-day growth, Peers helped). A beginner can top "growth" or "helped" while still low on raw score, so no single ladder decides who belongs.
- Tale of the Tape colors each person's *stronger* side (scarlet for you, blue for them) and grays the weaker side. Nothing is red for "losing".
- Skills are split into **You bring / Shared / They bring**. AI advice is written as mutual exchange ("Maya can unblock your state-estimation gap; you bring perception").
- The only call to action is **Team up**. Shipping together checks "cross-functional team delivery" for **both** students, so comparison turns directly into collaboration.

## 4. Hick's Law (Hick, 1952; Hyman, 1953) + Cognitive Load Theory (Sweller, 1988)
**Mentor 90-second review**

**Research.** Hick and Hyman showed that decision time rises with the logarithm of the number of equally likely choices. Sweller's cognitive load theory separates *intrinsic* load (the task itself) from *extraneous* load (how it's presented), and shows that cutting extraneous load improves performance.

**UI decisions.**
- **One project at a time**, with the queue on the left and auto-advance to the next unreviewed project.
- **Three decisions in a fixed order:** (1) a single 1–5 star rating, (2) up to 2 of 5 quick tags (optional), (3) one sentence capped at 140 characters. No open-ended form.
- The **AI baseline does the reading**: score plus 2–3 strengths and risks. The mentor verifies a summary instead of reading a repo cold, which removes extraneous load.
- **Sentence starters** generated from the AI's risks turn writing into recognition ("Next, fix: no temporal smoothing").
- A visible **timer (target 1:30)** makes the time promise concrete for busy Honda engineers.

## 5. Signaling Theory (Spence, 1973)
**Recruiter View**

**Research.** Spence (1973, *Quarterly Journal of Economics*) showed that a signal separates high-quality from low-quality candidates only if it is **harder to produce for low-quality candidates**. When everyone can produce it cheaply, everyone pools on it and it carries no information. AI-polished resumes are exactly such a cheap signal.

**UI decisions.**
- The Standardized Score comes from **artifacts** (repos, demos, team composition), not from resume wording. Rewriting the resume changes nothing; shipping does.
- A mentor endorsement is **opt-in** (off by default) and attaches the mentor's **name and reputation**, which makes it costly to give and therefore informative.
- Recruiters filter on **verified** signals (min score, rubric coverage, "require mentor verification", must-have rubric items), and the rubric is **published** to students, so the signal is legible on both sides.
- Invites are **two-way**: the recruiter must say what they offer (fast-track interview, project seat, intro call), so students get a signal about the company too.

---

### Live loop that ties it together
Mentor submits 5★ + endorsement → Mentor Verification jumps 15 → 65 → Standardized Score 55 → 65 → rubric coverage 63% → 75% → leaderboard ▲2 → student now clears the 99P Labs rubric → recruiter sends a two-way invite → student's bell lights up.

### References
- Collins, R. L. (1996). For better or worse: The impact of upward social comparison on self-evaluations. *Psychological Bulletin, 119*(1), 51–69.
- Festinger, L. (1954). A theory of social comparison processes. *Human Relations, 7*(2), 117–140.
- Fogg, B. J. (2009). A behavior model for persuasive design. *Proceedings of Persuasive '09*.
- Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*(7), 493–503.
- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis. *Advances in Experimental Social Psychology, 38*, 69–119.
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology, 4*(1), 11–26.
- Hull, C. L. (1932). The goal-gradient hypothesis and maze learning. *Psychological Review, 39*(1), 25–43.
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology, 45*(3), 188–196.
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research, 43*(1), 39–58.
- Lockwood, P., & Kunda, Z. (1997). Superstars and me: Predicting the impact of role models on the self. *Journal of Personality and Social Psychology, 73*(1), 91–103.
- Nunes, J. C., & Drèze, X. (2006). The endowed progress effect. *Journal of Consumer Research, 32*(4), 504–512.
- Spence, M. (1973). Job market signaling. *Quarterly Journal of Economics, 87*(3), 355–374.
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science, 12*(2), 257–285.
- Zeigarnik, B. (1927). Über das Behalten von erledigten und unerledigten Handlungen. *Psychologische Forschung, 9*, 1–85.
