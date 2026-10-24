// Sample data copied from the renderVals() sections of design/*.dc.html.
// Only api/client.ts may import this file. Pages get data through client.ts.
// Copy is unchanged from the designs except "Rungs", which is now "Talshift".

import type {
  CampusEvent,
  Candidate,
  EventScanInfo,
  FeedProject,
  HiringRole,
  Invite,
  NetworkContact,
  ProfessionalProfile,
  ProfessionalWeek,
  ProjectArea,
  ResumeFile,
  ResumeRole,
  ScoreExplanation,
  StudentOverview,
  StudentPlan,
} from './types.ts'

// ───────────── Student: Sam Okafor (design/student.dc.html) ─────────────

export const studentOverview: StudentOverview = {
  firstName: 'Sam',
  track: 'Design Engineering Intern',
  scoreBeforeReview: 56,
  scoreAfterReview: 65,
  weeklyChange: 9,
  nextTier: 75,
  dimensions: [
    { label: 'Technical depth', value: 72, next: 75 },
    { label: 'Real-world execution', value: 70, next: 75 },
    { label: 'Cross-functional teamwork', value: 48, next: 60 },
    { label: 'Mentor verification', value: 62, next: 75 },
  ],
  provenCount: 6,
  requiredCount: 9,
  hiddenProven: ['CAD tools', 'prototyping', 'user testing', 'ergonomics', 'documentation', 'mentor verification'],
  gaps: [
    { label: 'Engineering drawings and tolerances', evidence: 'Missing: a drawing with GD&T for one part', hours: 3 },
    { label: 'Stress analysis (FEA)', evidence: 'Missing: one static study with a result you checked', hours: 5 },
    { label: 'Cross-functional team delivery', evidence: 'Missing: a project with 3+ people from 2+ majors', hours: 6 },
  ],
  designReview: {
    reviewerName: 'Rina Matsuda',
    reviewerInitials: 'RM',
    reviewerRole: 'Research Engineer, Honda Research Institute',
    projectTitle: 'Split ergonomic keyboard case',
    stars: 5,
    note: 'Real daily-use testing is rare. Next, add a drawing with tolerances for the hinge so someone else could build it.',
  },
  scoreSources: 'From your resume (Oct 20), 3 GitHub repos and 1 verified mentor review',
}

export const studentPlan: StudentPlan = {
  weekend: {
    dates: 'Sat Oct 24 – Sun Oct 25',
    kind: '1-day challenge',
    hours: 5,
    closes: 'Stress analysis',
    title: 'Stress-test a 3D-printed bracket with FEA',
    description: 'Run a static study in Fusion 360 on your keyboard hinge, then break a printed one to compare. Ship the plot and one paragraph.',
    slots: [
      { label: 'Sat 10 AM', sentence: 'Saturday at 10 AM' },
      { label: 'Sat 2 PM', sentence: 'Saturday at 2 PM' },
      { label: 'Sun 10 AM', sentence: 'Sunday at 10 AM' },
    ],
    place: 'Thompson Library',
  },
  week: {
    dates: 'Mon Oct 26 – Fri Oct 30',
    title: '15-min office hours · Daniel R., Mechanical engineer',
    detail: 'Tue, Oct 27 · 4:00–4:15 PM · Virtual · 3 AI-prepared questions ready',
  },
  month: {
    dates: '5 weeks · starts Mon, Nov 2',
    title: 'In-cabin control knob study · Honda Research Institute',
    detail: 'Team of 4 · 6–8 hrs/week · proves team delivery and FEA',
  },
}

export const eventScanInfo: EventScanInfo = {
  scanned: 'Scanned 12 min ago',
  sources: ['Handshake', 'OSU Events', 'Devpost', 'MLH', 'Eventbrite', 'Columbus meetups'],
}

export const resumeFile: ResumeFile = {
  fileName: 'Sam_Okafor_Resume.pdf',
  detail: 'Uploaded Oct 20 · 1 page · 14 bullets read',
}

export const scoreExplanation: ScoreExplanation[] = [
  {
    label: 'Technical depth', value: 72, weight: '30%',
    items: [
      { sign: '+', text: 'Onshape and Fusion 360 used across 2 projects' },
      { sign: '+', text: 'Three printed revisions show real iteration' },
      { sign: '−', text: 'No stress analysis (FEA) or simulation in any project' },
      { sign: '−', text: 'No drawings with tolerances' },
    ],
  },
  {
    label: 'Real-world execution', value: 70, weight: '30%',
    items: [
      { sign: '+', text: 'Keyboard case repo has a build log and a 1:10 demo video' },
      { sign: '+', text: 'Tested through two weeks of real daily use' },
      { sign: '−', text: 'Only 1 of 3 projects has a demo someone can watch' },
    ],
  },
  {
    label: 'Cross-functional teamwork', value: 48, weight: '20%',
    items: [
      { sign: '+', text: 'Design Club member, listed on your resume' },
      { sign: '−', text: 'All 3 projects are solo' },
      { sign: '−', text: 'No collaborator from another major yet' },
    ],
  },
  {
    label: 'Mentor verification', value: 62, weight: '20%',
    items: [
      { sign: '+', text: '1 verified review: Rina Matsuda, 5★, endorsed your growth' },
      { sign: '−', text: 'Mentor weight grows with more reviews; 3 reviews would count for 50%' },
    ],
  },
]

export const events: CampusEvent[] = [
  { id: 'e1', kind: 'hack', month: 'NOV', day: '7', title: 'Make-a-thon: Assistive Devices', when: 'Sat–Sun, Nov 7–8 · 24 hours', where: 'Pomerene Hall', source: 'Devpost', why: 'CAD + prototyping, and teams form on Friday (closes your team gap)' },
  { id: 'e2', kind: 'recruit', month: 'NOV', day: '3', title: 'Honda Research Institute: Meet the Human-Factors Team', when: 'Tue, Nov 3 · 5:30 PM', where: 'Ohio Union', source: 'Handshake', why: 'Hiring for your track; Rina Matsuda is presenting' },
  { id: 'e3', kind: 'workshop', month: 'OCT', day: '28', title: 'GD&T Basics', when: 'Wed, Oct 28 · 7:00 PM', where: 'Scott Lab', source: 'OSU Events', why: 'Closes your drawings and tolerances gap' },
  { id: 'e4', kind: 'hack', month: 'OCT', day: '29', title: 'Hardware Hack Night', when: 'Thu, Oct 29 · 6:00 PM', where: 'Downtown makerspace · 2.1 mi', source: 'Eventbrite', why: '3D printing and quick builds; 2 people in your network are going' },
  { id: 'e5', kind: 'fair', month: 'NOV', day: '12', title: 'Fall Engineering Expo', when: 'Thu, Nov 12 · 10 AM–3 PM', where: 'Ohio Union', source: 'Handshake', why: '14 employers listed design-engineering internships' },
  { id: 'e6', kind: 'recruit', month: 'NOV', day: '4', title: 'Product Design Portfolio Night', when: 'Wed, Nov 4 · 6:30 PM', where: 'Short North · 2.8 mi', source: 'Columbus meetups', why: '3 local studios reviewing student portfolios' },
]

// Events Sam has already saved when the page first loads.
export const savedEventIds: string[] = ['e1']

export const network: NetworkContact[] = [
  { id: 'n1', type: 'mentor', initials: 'RM', name: 'Rina Matsuda', role: 'Research Engineer · Honda Research Institute', credibility: 94, why: ['Reviewed your keyboard case and endorsed you', '96% of her advice verified · replies in about a day'], opener: "Thanks for the review. Could I show you the hinge drawing once it's done?", action: 'Message' },
  { id: 'n2', type: 'recruiter', initials: 'JC', name: 'Jamie Cole', role: 'University Talent Partner · 99P Labs', credibility: 91, why: ['Hiring Design Engineering interns this spring', '11 of 12 students she invited got a reply within a week'], opener: "I'm working toward your Design Engineering rubric; 6 of 9 verified so far.", action: 'Connect' },
  { id: 'n3', type: 'mentor', initials: 'DR', name: 'Daniel R.', role: 'Mechanical Engineer · automotive supplier', credibility: 88, why: ['Reviews CAD work weekly · 41 verified reviews', 'Office hours Tue 4:00 PM, 1 seat left'], opener: 'Which tolerances matter most on a printed hinge?', action: 'Request 15 min' },
  { id: 'n4', type: 'student', initials: 'PS', name: 'Priya Shah', role: 'Mechanical Engineering · Sophomore', match: 'Complementary', why: ['Brings ANSYS FEA and GD&T, two of your open gaps', 'Looking for someone who does user testing'], opener: "Want to team up on Saturday's FEA challenge? I'll handle the user testing side.", action: 'Team up' },
  { id: 'n5', type: 'recruiter', initials: 'ML', name: 'Morgan Lee', role: 'Campus Recruiter · regional mobility company', credibility: 72, why: ['Posted 2 product design internships on Handshake', 'Newer to Talshift: 3 invites sent so far'], opener: 'I saw your product design internship; my keyboard case covers ergonomics testing.', action: 'Connect' },
  { id: 'n6', type: 'student', initials: 'AR', name: 'Ana Ruiz', role: 'Industrial Design · Junior', match: 'Similar', why: ['Also targeting design engineering; 2 points ahead of you', 'Going to Hardware Hack Night on Thursday'], opener: 'See you at Hack Night? Want to trade portfolio feedback?', action: 'Connect' },
]

export const resumeRoles: ResumeRole[] = [
  {
    id: 'dei', label: 'Design Engineering Intern', summary: '6 of 9 requirements visible on your resume',
    items: [
      { severity: 'good', type: 'Strong evidence', where: 'Projects · line 6', quote: 'Tested the case through two weeks of daily use and logged comfort each day.', note: "Keep this. It's the kind of proof recruiters for this role ask about." },
      { severity: 'warn', type: 'Unclear impact', where: 'Projects · line 5', quote: 'Designed and printed an ergonomic split keyboard case.', note: 'What changed for the user? Wrist angle, comfort rating, assembly time. Add the number you measured.' },
      { severity: 'miss', type: 'Missing for this role', where: 'Whole resume', quote: '', note: "No drawings or tolerances anywhere. Recruiters check for this. Add it only after you've done it; the GD&T workshop on Wed gets you there." },
      { severity: 'warn', type: 'Claim without a link', where: 'Projects', quote: '', note: 'None of your projects link to proof. Add your verified Talshift link so each claim can be checked.' },
    ],
  },
  {
    id: 'pde', label: 'Product Design Engineer', summary: '5 of 8 requirements visible on your resume',
    items: [
      { severity: 'good', type: 'Strong evidence', where: 'Projects · line 6', quote: 'Tested the case through two weeks of daily use and logged comfort each day.', note: 'User testing is a top requirement for this role. Keep it near the top.' },
      { severity: 'miss', type: 'Missing for this role', where: 'Whole resume', quote: '', note: 'No design-for-manufacturing (DFM) work. Mention it only if a project actually considered cost or production.' },
      { severity: 'warn', type: 'Vague role', where: 'Activities · line 11', quote: 'Member, Design Club', note: 'What did you build or lead in the club? One concrete outcome is enough.' },
    ],
  },
  {
    id: 'mdi', label: 'Mechanical Design Intern', summary: '4 of 9 requirements visible on your resume',
    items: [
      { severity: 'miss', type: 'Missing for this role', where: 'Skills', quote: '', note: "SolidWorks is listed in 8 of 10 postings for this role. You use Onshape and Fusion 360; say so plainly, don't claim SolidWorks." },
      { severity: 'miss', type: 'Missing for this role', where: 'Whole resume', quote: '', note: "No stress analysis. Saturday's FEA challenge would give you something true to write." },
      { severity: 'good', type: 'Strong evidence', where: 'Projects · line 4', quote: 'Three printed revisions of the hinge.', note: 'Iteration is valued here. Say what you changed between revisions.' },
    ],
  },
]

// ───────────── Professional: Rina Matsuda ─────────────

// Project feed (design/mentor.dc.html)

export const professionalWeek: ProfessionalWeek = {
  reviewsDone: 3,
  adviceVerified: '92%',
  officeHours: 'Office hours Tue 4:00 PM · 2 of 3 booked',
}

export const projectAreas:{ id: ProjectArea | 'all'; label: string; relatedLabel: string }[] = [
  { id: 'all', label: 'All projects', relatedLabel: '' },
  { id: 'cad', label: 'CAD', relatedLabel: 'CAD projects' },
  { id: 'ml', label: 'Machine learning', relatedLabel: 'ML projects' },
  { id: 'backend', label: 'Backend', relatedLabel: 'Backend projects' },
]

export const feedProjects: FeedProject[] = [
  {
    id: 'p-mc', studentId: 'mc', studentName: 'Maya Chen', initials: 'MC', major: 'Mechanical Engineering · Junior', targeting: 'Mechanical Design Intern', area: 'cad',
    title: 'Servo-driven prosthetic wrist',
    summary: 'Modeled a 14-part wrist assembly in Fusion 360, printed three revisions, and tolerance-tested the servo mount. Documented every design change with drawings.',
    tags: [{ label: 'CAD', area: 'cad' }, { label: 'Fusion 360', area: 'cad' }, { label: '3D printing', area: 'cad' }, { label: 'Arduino', area: '' }],
    strength: 'Drawings with tolerances for every revision', risk: 'No stress check on the servo bracket',
    ai: 88, ratings: [5, 5, 4, 5, 4],
    quotes: [
      { text: "Clean part breakout and sensible tolerances. I'd love to see a stress check on the servo bracket next.", who: 'Daniel R. · Mechanical engineer' },
      { text: 'Great iteration log. Easy to follow what changed and why.', who: 'Ana P. · Design lead' },
    ],
    related: [{ title: 'Compliant gripper', ai: 81 }, { title: 'Bike hub redesign', ai: 74 }, { title: 'Desk fan teardown', ai: 70 }],
    skills: [{ label: 'CAD modeling', score: 94, area: 'cad' }, { label: '3D printing', score: 90, area: 'cad' }, { label: 'Mechanical design', score: 88, area: 'cad' }, { label: 'Electronics integration', score: 78, area: '' }],
  },
  {
    id: 'p-je', studentId: 'je', studentName: 'Jordan Ellis', initials: 'JE', major: 'Mechanical Engineering · Senior', targeting: 'Product Design Engineer', area: 'cad',
    title: 'Drone gimbal housing',
    summary: 'Designed a lightweight gimbal housing in SolidWorks with snap-fit joints, cutting weight 22% against the stock part. Ran a simple drop test on the prototype.',
    tags: [{ label: 'CAD', area: 'cad' }, { label: 'SolidWorks', area: 'cad' }, { label: 'Design for manufacturing', area: 'cad' }, { label: 'Testing', area: '' }],
    strength: 'Weight savings measured against the stock part', risk: 'Snap-fit validation is not documented',
    ai: 82, ratings: [4, 4, 5],
    quotes: [{ text: 'Good weight reduction. Add more detail on how you validated the snap-fits.', who: 'Priya S. · Manufacturing engineer' }],
    related: [{ title: 'Bike light mount', ai: 74 }],
    skills: [{ label: 'SolidWorks', score: 86, area: 'cad' }, { label: 'Design for manufacturing', score: 82, area: 'cad' }, { label: 'Testing', score: 70, area: '' }],
  },
  {
    // Sam's project: the one the professional rates in the demo loop (CLAUDE.md §5).
    id: 'p-so', studentId: 'so', studentName: 'Sam Okafor', initials: 'SO', major: 'Industrial Design · Sophomore', targeting: 'Design Engineering Intern', area: 'cad',
    title: 'Split ergonomic keyboard case',
    summary: 'Sketched and modeled a two-piece adjustable keyboard case in Onshape, then printed it and tested it over two weeks of daily use.',
    tags: [{ label: 'CAD', area: 'cad' }, { label: 'Onshape', area: 'cad' }, { label: '3D printing', area: 'cad' }, { label: 'Ergonomics', area: '' }],
    strength: 'Tested by real daily use for two weeks', risk: 'No drawings or tolerances in the repo',
    ai: 72, ratings: [], quotes: [], related: [],
    skills: [{ label: 'CAD modeling', score: 76, area: 'cad' }, { label: '3D printing', score: 80, area: 'cad' }, { label: 'Ergonomics', score: 74, area: '' }],
  },
  {
    id: 'p-lp', studentId: 'lp', studentName: 'Lena Park', initials: 'LP', major: 'Data Analytics · Senior', targeting: 'Data Scientist', area: 'ml',
    title: 'Campus parking demand forecast',
    summary: 'Gradient-boosted model that forecasts garage occupancy a day ahead, at 9.8% error on a held-out month. The parking office uses the dashboard.',
    tags: [{ label: 'Machine learning', area: 'ml' }, { label: 'scikit-learn', area: 'ml' }, { label: 'SQL', area: '' }, { label: 'Dashboards', area: '' }],
    strength: 'Honest holdout evaluation with a reported error', risk: 'An event-day feature may leak future information',
    ai: 85, ratings: [5, 4, 5, 4],
    quotes: [{ text: 'Real stakeholder, real metric. Drop the leaky feature and re-report.', who: 'Kenji T. · Data scientist' }],
    related: [{ title: 'Rec center crowd model', ai: 76 }, { title: 'Bus ridership EDA', ai: 68 }, { title: 'Dining wait times', ai: 72 }],
    skills: [{ label: 'Modeling', score: 84, area: 'ml' }, { label: 'Evaluation', score: 88, area: 'ml' }, { label: 'SQL', score: 76, area: '' }, { label: 'Visualization', score: 80, area: '' }],
  },
  {
    id: 'p-rm', studentId: 'rm', studentName: 'Ravi Menon', initials: 'RM', major: 'Computer Science & Eng. · Junior', targeting: 'ML Engineer Intern', area: 'ml',
    title: 'Lecture audio summarizer',
    summary: 'Transcribes lecture recordings and builds topic-by-topic summaries. Tested on 40 hours of OSU lecture audio with a student rating study.',
    tags: [{ label: 'Machine learning', area: 'ml' }, { label: 'PyTorch', area: 'ml' }, { label: 'NLP', area: 'ml' }, { label: 'FastAPI', area: '' }],
    strength: 'Evaluated with real student ratings', risk: 'No latency or cost numbers',
    ai: 79, ratings: [4, 4],
    quotes: [{ text: 'Nice user study. Report how long a summary takes to generate.', who: 'Marcus H. · Software engineer' }],
    related: [{ title: 'Course review sentiment', ai: 73 }],
    skills: [{ label: 'NLP', score: 82, area: 'ml' }, { label: 'Deep learning', score: 78, area: 'ml' }, { label: 'APIs', score: 72, area: '' }],
  },
  {
    id: 'p-ta', studentId: 'ta', studentName: 'Tessa Alvarez', initials: 'TA', major: 'Computer Science & Eng. · Senior', targeting: 'Backend Engineer', area: 'backend',
    title: 'Fleet telemetry ingest service',
    summary: 'A Go service that ingests 2,000 sample vehicle messages a second into Postgres and flags anomalies. Load-tested and deployed with Docker.',
    tags: [{ label: 'Backend', area: 'backend' }, { label: 'Go', area: 'backend' }, { label: 'Postgres', area: 'backend' }, { label: 'Docker', area: '' }],
    strength: 'Throughput measured under load', risk: 'Auth uses one shared key',
    ai: 87, ratings: [5, 5, 4, 5],
    quotes: [{ text: 'Production-minded. Swap the shared key for per-device tokens.', who: 'Omar K. · Platform engineer' }],
    related: [{ title: 'Rate limiter library', ai: 84 }, { title: 'Club room booking API', ai: 77 }, { title: 'Log search CLI', ai: 72 }],
    skills: [{ label: 'API design', score: 88, area: 'backend' }, { label: 'Databases', score: 86, area: 'backend' }, { label: 'DevOps', score: 80, area: '' }],
  },
  {
    id: 'p-oh', studentId: 'oh', studentName: 'Omar Haddad', initials: 'OH', major: 'Computer Science & Eng. · Sophomore', targeting: 'Backend Intern', area: 'backend',
    title: 'Club room booking API',
    summary: 'REST API with auth for booking student-org rooms, used by two clubs this semester. Node, Express and SQLite.',
    tags: [{ label: 'Backend', area: 'backend' }, { label: 'Node.js', area: 'backend' }, { label: 'REST', area: 'backend' }, { label: 'SQLite', area: '' }],
    strength: 'Two clubs are using it now', risk: 'No automated tests',
    ai: 70, ratings: [], quotes: [], related: [],
    skills: [{ label: 'API design', score: 72, area: 'backend' }, { label: 'Databases', score: 66, area: 'backend' }, { label: 'Testing', score: 40, area: '' }],
  },
]

// Find students and Invites (design/recruiter.dc.html)

export const hiringRoles: HiringRole[] = [
  { id: 'de', label: 'Design Engineering Intern' },
  { id: 'ml', label: 'ML Engineer Intern' },
  { id: 'be', label: 'Backend Intern' },
]

// `score` is each student's profile score. Sam's 65 is his score after the verified review.
export const candidates: Candidate[] = [
  { id: 'mc', role: 'de', initials: 'MC', name: 'Maya Chen', major: 'Mechanical Eng. · Junior', project: 'Servo-driven prosthetic wrist', skills: ['Fusion 360', 'GD&T', '3D printing', 'Arduino'], skillHits: 3, match: 92, score: 82, rubric: { proven: 8, total: 9 }, reviews: 5, growth: 4 },
  { id: 'je', role: 'de', initials: 'JE', name: 'Jordan Ellis', major: 'Mechanical Eng. · Senior', project: 'Drone gimbal housing', skills: ['SolidWorks', 'DFM', 'FEA', 'Testing'], skillHits: 3, match: 86, score: 79, rubric: { proven: 7, total: 9 }, reviews: 3, growth: 2 },
  { id: 'so', role: 'de', initials: 'SO', name: 'Sam Okafor', major: 'Industrial Design · Sophomore', project: 'Split ergonomic keyboard case', skills: ['Onshape', 'User testing', 'Ergonomics', '3D printing'], skillHits: 3, match: 78, score: 65, rubric: { proven: 6, total: 9 }, reviews: 1, growth: 9 },
  { id: 'ar', role: 'de', initials: 'AR', name: 'Ana Ruiz', major: 'Industrial Design · Junior', project: 'Modular desk lamp', skills: ['Fusion 360', 'Rendering', 'User research'], skillHits: 2, match: 74, score: 67, rubric: { proven: 6, total: 9 }, reviews: 2, growth: 6 },
  { id: 'ps', role: 'de', initials: 'PS', name: 'Priya Shah', major: 'Mechanical Eng. · Sophomore', project: 'Bike-rack load study', skills: ['ANSYS', 'FEA', 'GD&T', 'MATLAB'], skillHits: 2, match: 71, score: 63, rubric: { proven: 5, total: 9 }, reviews: 1, growth: 11 },
  { id: 'nb', role: 'de', initials: 'NB', name: 'Noah Brooks', major: 'Electrical & Computer Eng. · Freshman', project: 'Rover suspension bracket', skills: ['SolidWorks', 'FEA', '3D printing'], skillHits: 2, match: 64, score: 58, rubric: { proven: 4, total: 9 }, reviews: 0, growth: 12 },
  { id: 'lp', role: 'ml', initials: 'LP', name: 'Lena Park', major: 'Data Analytics · Senior', project: 'Parking demand forecast', skills: ['scikit-learn', 'SQL', 'Forecasting'], skillHits: 3, match: 88, score: 80, rubric: { proven: 7, total: 8 }, reviews: 4, growth: 3 },
  { id: 'rm', role: 'ml', initials: 'RM', name: 'Ravi Menon', major: 'CSE · Junior', project: 'Lecture audio summarizer', skills: ['PyTorch', 'NLP', 'FastAPI'], skillHits: 3, match: 83, score: 74, rubric: { proven: 6, total: 8 }, reviews: 2, growth: 8 },
  { id: 'ta', role: 'be', initials: 'TA', name: 'Tessa Alvarez', major: 'CSE · Senior', project: 'Fleet telemetry ingest service', skills: ['Go', 'Postgres', 'Docker'], skillHits: 3, match: 93, score: 85, rubric: { proven: 8, total: 8 }, reviews: 4, growth: 2 },
  { id: 'oh', role: 'be', initials: 'OH', name: 'Omar Haddad', major: 'CSE · Sophomore', project: 'Club room booking API', skills: ['Node.js', 'REST', 'SQLite'], skillHits: 2, match: 72, score: 60, rubric: { proven: 5, total: 8 }, reviews: 0, growth: 10 },
]

export const invites: Invite[] = [
  { id: 'i-mc', studentId: 'mc', initials: 'MC', name: 'Maya Chen', detail: 'Design Engineering Intern · fast-track interview · sent Oct 19', status: 'accepted' },
  { id: 'i-ta', studentId: 'ta', initials: 'TA', name: 'Tessa Alvarez', detail: 'Backend Intern · project seat · sent Oct 18', status: 'accepted' },
  { id: 'i-je', studentId: 'je', initials: 'JE', name: 'Jordan Ellis', detail: 'Design Engineering Intern · intro call · sent Oct 22', status: 'question' },
]

// My profile (design/mentor.dc.html)

export const professionalProfile: ProfessionalProfile = {
  initials: 'RM',
  name: 'Rina Matsuda',
  title: 'Research Engineer · Honda Research Institute · mentoring in CAD and human factors',
  credibility: 94,
  credibilityLabel: 'Highly credible',
  rankLine: 'Top 8% of mentors on Talshift.',
  suggestedThisWeek: 210,
  suggestedChange: '+34%',
  parts: [
    { label: 'Advice verified', value: '96% (24 of 25)', percent: 96 },
    { label: 'Median reply to students', value: '1 day', percent: 82 },
    { label: 'Active days, last 30', value: '12 of 30', percent: 40 },
    { label: 'Students who closed a gap after your advice', value: '7', percent: 70 },
    { label: "Students' rating of your help", value: '4.9 / 5 (18 ratings)', percent: 98 },
  ],
  tips: [
    'Review 2 CAD projects that have no mentor reviews yet.',
    'Keep your Tuesday office-hour slot. Cancelled slots lower your reply score.',
  ],
  footnote: 'Credibility comes from verified advice and student outcomes, so a few good reviews beat many quick ones.',
}
