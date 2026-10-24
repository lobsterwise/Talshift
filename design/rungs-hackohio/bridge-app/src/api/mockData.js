// ─────────────────────────────────────────────────────────────────────────────
// mockData.js — every piece of sample data the demo needs, in one place.
// Backend team: each export here maps to one table / endpoint. When an API is
// ready, the matching function in client.js switches from this file to fetch().
// All people, events and dates below are SAMPLE data for the HackOHI/O demo.
// ─────────────────────────────────────────────────────────────────────────────

// Skill dictionary used by the resume parser. key → { label, pattern }
export const SKILLS = {
  python: { label: 'Python', pattern: /\bpython\b/i },
  java: { label: 'Java', pattern: /\bjava\b/i },
  cpp: { label: 'C++', pattern: /c\+\+/i },
  typescript: { label: 'TypeScript', pattern: /\btypescript\b|\bts\b/i },
  javascript: { label: 'JavaScript', pattern: /\bjavascript\b|\bjs\b/i },
  ros: { label: 'ROS 2', pattern: /\bros ?2?\b/i },
  opencv: { label: 'OpenCV', pattern: /\bopencv\b/i },
  pytorch: { label: 'PyTorch', pattern: /\bpytorch\b/i },
  tensorflow: { label: 'TensorFlow', pattern: /\btensorflow\b/i },
  sklearn: { label: 'scikit-learn', pattern: /scikit|sklearn/i },
  kalman: { label: 'Kalman Filtering', pattern: /kalman|sensor fusion|state estimation/i },
  slam: { label: 'SLAM', pattern: /\bslam\b/i },
  gazebo: { label: 'Gazebo / Sim', pattern: /gazebo|carla|isaac sim|webots/i },
  testing: { label: 'Automated Testing', pattern: /unit test|pytest|junit|gtest|testing/i },
  react: { label: 'React', pattern: /\breact\b/i },
  node: { label: 'Node.js', pattern: /\bnode(\.js)?\b|express/i },
  sql: { label: 'SQL', pattern: /\bsql\b|postgres|mysql|sqlite/i },
  docker: { label: 'Docker', pattern: /\bdocker\b|container/i },
  cloud: { label: 'Cloud (AWS/GCP)', pattern: /\baws\b|\bgcp\b|azure|cloud/i },
  git: { label: 'Git', pattern: /\bgit\b|github/i },
  linux: { label: 'Linux', pattern: /\blinux\b|ubuntu|bash/i },
  matlab: { label: 'MATLAB', pattern: /\bmatlab\b|simulink/i },
  figma: { label: 'Figma', pattern: /\bfigma\b/i },
  research: { label: 'User Research', pattern: /user research|usability|interviews?\b/i },
  dataviz: { label: 'Data Visualization', pattern: /visuali[sz]ation|tableau|d3\b|dashboard/i },
  mlops: { label: 'Model Deployment', pattern: /deploy(ed)? (a |the )?model|mlops|onnx|inference server/i },
  api: { label: 'REST APIs', pattern: /\brest\b|\bapi\b|graphql/i },
}

// Target roles. Each requirement is one line of the "What recruiters actually
// look for" rubric. `skills` = any of these proves it; `evidence` = special rule.
export const ROLES = {
  robotics: {
    id: 'robotics',
    label: 'Autonomous Systems / Robotics',
    short: 'Robotics',
    requirements: [
      { id: 'r-lang', label: 'Production language: C++ or Python', skills: ['cpp', 'python'], proof: 'Any repo with 300+ lines in C++ or Python',
        challenge: { title: 'Rewrite a Python node in modern C++', hours: 5 } },
      { id: 'r-ros', label: 'Robotics middleware (ROS 2)', skills: ['ros'], proof: 'A ROS 2 package with at least 2 nodes talking over topics',
        challenge: { title: 'Two-node ROS 2 publisher/subscriber with a launch file', hours: 4 } },
      { id: 'r-perc', label: 'Perception (OpenCV / PyTorch)', skills: ['opencv', 'pytorch'], proof: 'A vision pipeline with a measured accuracy number',
        challenge: { title: 'Lane detection on 99P Labs sample dashcam clips', hours: 6 } },
      { id: 'r-state', label: 'State estimation (Kalman / SLAM)', skills: ['kalman', 'slam'], proof: 'A filter that tracks an object, with an error plot',
        challenge: { title: 'Kalman Filter Tracker in a Day', hours: 6 } },
      { id: 'r-sim', label: 'Simulation & automated testing', skills: ['gazebo', 'testing'], proof: 'CI that runs at least one sim or unit test',
        challenge: { title: 'Add a Gazebo smoke test + GitHub Actions CI', hours: 5 } },
      { id: 'r-ship', label: 'Shipped an end-to-end project (public repo + demo)', evidence: 'shipped', proof: 'Repo link + video or live demo',
        challenge: { title: 'Record a 60-second demo + README for your best repo', hours: 2 } },
      { id: 'r-team', label: 'Cross-functional team delivery', evidence: 'team', proof: 'A project with 3+ contributors from 2+ majors',
        challenge: { title: 'Team up with a peer on this weekend\'s challenge', hours: 6 } },
      { id: 'r-verify', label: 'Industry mentor verification', evidence: 'mentor', proof: 'At least one mentor rating of 4★ or higher',
        challenge: { title: 'Submit a project to the Mentor Showcase feed', hours: 1 } },
    ],
    leetcode: ['Graphs: Dijkstra & A* on grids', 'Intervals: sweep-line scheduling', 'Heaps: k-nearest obstacles', 'System design: a ROS 2 telemetry pipeline at 100 Hz'],
    capstone: {
      title: 'Pedestrian-Intent Sensor Fusion',
      company: 'Honda 99P Labs',
      weeks: 5,
      starts: 'Mon, Nov 2',
      commitment: '6–8 hrs/week · 30-min weekly mentor sync',
      team: 'Team of 4: perception, state estimation, UX, data',
      closes: ['r-state', 'r-team', 'r-verify'],
      blurb: 'Fuse camera detections with radar tracks on a 99P Labs sample mobility dataset to predict whether a pedestrian will cross. Ships as a dashboard demo for the HRI research team.',
    },
  },
  ml: {
    id: 'ml',
    label: 'AI & Machine Learning',
    short: 'AI / ML',
    requirements: [
      { id: 'm-lang', label: 'Python + numerical stack', skills: ['python'], proof: 'Notebook or repo using NumPy/pandas',
        challenge: { title: 'Clean and profile a messy 99P Labs trip dataset', hours: 4 } },
      { id: 'm-dl', label: 'Deep learning framework (PyTorch / TF)', skills: ['pytorch', 'tensorflow'], proof: 'A trained model with a training curve',
        challenge: { title: 'Fine-tune a small vision model in a day', hours: 6 } },
      { id: 'm-classic', label: 'Classical ML & evaluation', skills: ['sklearn'], proof: 'Train/val/test split with a reported metric',
        challenge: { title: 'Baseline vs. tuned gradient boosting shoot-out', hours: 4 } },
      { id: 'm-data', label: 'Data engineering (SQL)', skills: ['sql'], proof: 'A query or pipeline over 100k+ rows',
        challenge: { title: 'Build a SQL feature table from raw trip logs', hours: 4 } },
      { id: 'm-deploy', label: 'Model deployment', skills: ['mlops', 'docker'], proof: 'A model served behind an endpoint or container',
        challenge: { title: 'Ship your model behind a FastAPI endpoint in Docker', hours: 5 } },
      { id: 'm-ship', label: 'Shipped an end-to-end project (public repo + demo)', evidence: 'shipped', proof: 'Repo link + video or live demo',
        challenge: { title: 'Record a 60-second demo + README for your best repo', hours: 2 } },
      { id: 'm-team', label: 'Cross-functional team delivery', evidence: 'team', proof: 'A project with 3+ contributors from 2+ majors',
        challenge: { title: 'Team up with a peer on this weekend\'s challenge', hours: 6 } },
      { id: 'm-verify', label: 'Industry mentor verification', evidence: 'mentor', proof: 'At least one mentor rating of 4★ or higher',
        challenge: { title: 'Submit a project to the Mentor Showcase feed', hours: 1 } },
    ],
    leetcode: ['Hash maps: feature dedup at scale', 'Two pointers: sliding-window aggregates', 'Top-K with heaps', 'System design: a batch + online feature store'],
    capstone: {
      title: 'Trip-Purpose Classifier for Mobility Data',
      company: 'Honda 99P Labs',
      weeks: 4,
      starts: 'Mon, Nov 2',
      commitment: '6 hrs/week · 30-min weekly mentor sync',
      team: 'Team of 4: ML, data eng, analytics, UX',
      closes: ['m-deploy', 'm-team', 'm-verify'],
      blurb: 'Predict trip purpose from anonymized sample telematics and serve the model behind an API the research team can query.',
    },
  },
  fullstack: {
    id: 'fullstack',
    label: 'Full-Stack Engineering',
    short: 'Full-Stack',
    requirements: [
      { id: 'f-fe', label: 'Modern frontend (React / TS)', skills: ['react', 'typescript'], proof: 'A deployed React app',
        challenge: { title: 'Build a filterable data table in React in a day', hours: 5 } },
      { id: 'f-be', label: 'Backend services & REST APIs', skills: ['node', 'api'], proof: 'An API with at least 3 routes',
        challenge: { title: 'CRUD API with auth in one afternoon', hours: 5 } },
      { id: 'f-db', label: 'Relational data modeling (SQL)', skills: ['sql'], proof: 'A schema with joins and migrations',
        challenge: { title: 'Design a schema for a campus events app', hours: 3 } },
      { id: 'f-ops', label: 'Containers & cloud deploy', skills: ['docker', 'cloud'], proof: 'A live URL',
        challenge: { title: 'Containerize and deploy an app to the cloud', hours: 4 } },
      { id: 'f-test', label: 'Automated testing & CI', skills: ['testing'], proof: 'A green CI badge',
        challenge: { title: 'Add tests + GitHub Actions to an existing repo', hours: 3 } },
      { id: 'f-ship', label: 'Shipped an end-to-end project (public repo + demo)', evidence: 'shipped', proof: 'Repo link + video or live demo',
        challenge: { title: 'Record a 60-second demo + README for your best repo', hours: 2 } },
      { id: 'f-team', label: 'Cross-functional team delivery', evidence: 'team', proof: 'A project with 3+ contributors from 2+ majors',
        challenge: { title: 'Team up with a peer on this weekend\'s challenge', hours: 6 } },
      { id: 'f-verify', label: 'Industry mentor verification', evidence: 'mentor', proof: 'At least one mentor rating of 4★ or higher',
        challenge: { title: 'Submit a project to the Mentor Showcase feed', hours: 1 } },
    ],
    leetcode: ['Design: LRU cache', 'Graphs: dependency resolution (topo sort)', 'Strings: rate-limited tokenizer', 'System design: a real-time notification service'],
    capstone: {
      title: 'Fleet Telemetry Web Console',
      company: 'Honda 99P Labs',
      weeks: 4,
      starts: 'Mon, Nov 2',
      commitment: '6 hrs/week · 30-min weekly mentor sync',
      team: 'Team of 4: frontend, backend, data, UX',
      closes: ['f-ops', 'f-team', 'f-verify'],
      blurb: 'Build a web console that streams sample vehicle telemetry, flags anomalies and lets researchers annotate events.',
    },
  },
  ux: {
    id: 'ux',
    label: 'UX & Product Systems',
    short: 'UX / Product',
    requirements: [
      { id: 'u-tool', label: 'Design tooling (Figma)', skills: ['figma'], proof: 'A clickable prototype',
        challenge: { title: 'Prototype a 3-screen flow in Figma in a day', hours: 5 } },
      { id: 'u-research', label: 'User research & usability testing', skills: ['research'], proof: '5 interviews with synthesized findings',
        challenge: { title: 'Run 5 hallway usability tests on a campus app', hours: 4 } },
      { id: 'u-data', label: 'Data-informed design', skills: ['dataviz', 'sql'], proof: 'A design decision backed by a metric',
        challenge: { title: 'Dashboard teardown: redesign one chart with evidence', hours: 3 } },
      { id: 'u-code', label: 'Can prototype in code', skills: ['react', 'javascript'], proof: 'A coded prototype or front-end PR',
        challenge: { title: 'Turn your Figma screen into a React component', hours: 5 } },
      { id: 'u-ship', label: 'Shipped an end-to-end project (public repo + demo)', evidence: 'shipped', proof: 'Case study + live link',
        challenge: { title: 'Write a 1-page case study for your best project', hours: 2 } },
      { id: 'u-team', label: 'Cross-functional team delivery', evidence: 'team', proof: 'Worked with engineers on a shipped feature',
        challenge: { title: 'Team up with an engineer on this weekend\'s challenge', hours: 6 } },
      { id: 'u-verify', label: 'Industry mentor verification', evidence: 'mentor', proof: 'At least one mentor rating of 4★ or higher',
        challenge: { title: 'Submit a project to the Mentor Showcase feed', hours: 1 } },
    ],
    leetcode: ['Design critique: driver-alert hierarchy', 'Heuristic evaluation (Nielsen\'s 10)', 'Metrics: defining a north-star for an in-car app', 'Service blueprinting for EV charging'],
    capstone: {
      title: 'In-Cabin Alert Design Study',
      company: 'Honda Research Institute',
      weeks: 5,
      starts: 'Mon, Nov 2',
      commitment: '6 hrs/week · 30-min weekly mentor sync',
      team: 'Team of 4: UX research, prototyping, engineering, data',
      closes: ['u-research', 'u-team', 'u-verify'],
      blurb: 'Design and test alert patterns that minimize driver distraction, with a coded prototype the research team can run in their simulator.',
    },
  },
}

// Pre-filled resume so the demo works with one click. Edit freely in the UI.
export const SAMPLE_RESUME = `Jordan Patel — B.S. Computer Science & Engineering, The Ohio State University (Expected 2028)

SKILLS
Python, C++, Java, ROS 2, OpenCV, Git, Linux, SQL, React

PROJECTS
Project: Buckeye Rover Lane Perception — OpenCV + Python lane-line detection running on a ROS 2 rover; 87% frame accuracy on test track. Team of 4 (CSE, ECE, ME). github.com/jpatel/rover-lanes (demo video)
Project: COTA Bus ETA Tracker — React + Node web app that predicts campus bus arrival times. Solo. github.com/jpatel/cota-eta
Project: Dorm Inventory CLI — Java command-line tool for tracking shared supplies.

EXPERIENCE
Undergraduate Research Assistant, OSU Driving Simulation Lab — cleaned simulator logs in Python.
Teaching Assistant, Intro to Programming (Java) — led weekly lab sections of 30 students.`

export const SAMPLE_GITHUB = 'https://github.com/jpatel'

// Community peers. Scores are already standardized by the backend.
export const PEERS = [
  { id: 'p1', name: 'Maya Chen', initials: 'MC', major: 'Electrical & Computer Eng.', year: "'27", role: 'robotics',
    scores: { technical: 86, shipping: 74, teamwork: 66, verification: 80 }, growth30d: 9, endorsements: 2, helped: 6,
    skills: ['cpp', 'ros', 'kalman', 'slam', 'gazebo', 'linux', 'matlab', 'git'],
    lookingFor: 'A perception + web partner for the 99P Labs sensor-fusion project' },
  { id: 'p2', name: 'Andre Okafor', initials: 'AO', major: 'Mechanical Engineering', year: "'28", role: 'robotics',
    scores: { technical: 64, shipping: 58, teamwork: 78, verification: 52 }, growth30d: 14, endorsements: 1, helped: 9,
    skills: ['matlab', 'python', 'gazebo', 'git'],
    lookingFor: 'Someone strong in code to pair with on controls + sim' },
  { id: 'p3', name: 'Priya Raman', initials: 'PR', major: 'Computer Science & Eng.', year: "'27", role: 'ml',
    scores: { technical: 88, shipping: 80, teamwork: 60, verification: 84 }, growth30d: 6, endorsements: 3, helped: 4,
    skills: ['python', 'pytorch', 'sklearn', 'sql', 'docker', 'mlops', 'git', 'cloud'],
    lookingFor: 'A domain partner from robotics or design' },
  { id: 'p4', name: 'Sam Whitaker', initials: 'SW', major: 'Design (Interaction)', year: "'27", role: 'ux',
    scores: { technical: 58, shipping: 72, teamwork: 84, verification: 70 }, growth30d: 11, endorsements: 2, helped: 12,
    skills: ['figma', 'research', 'dataviz', 'javascript'],
    lookingFor: 'Engineers who want their demo to actually be usable' },
  { id: 'p5', name: 'Lena Kowalski', initials: 'LK', major: 'Data Analytics', year: "'28", role: 'ml',
    scores: { technical: 72, shipping: 62, teamwork: 70, verification: 58 }, growth30d: 17, endorsements: 1, helped: 5,
    skills: ['python', 'sql', 'sklearn', 'dataviz', 'git'],
    lookingFor: 'First deep-learning project with a team' },
  { id: 'p6', name: 'Diego Hernández', initials: 'DH', major: 'Industrial & Systems Eng.', year: "'27", role: 'fullstack',
    scores: { technical: 70, shipping: 78, teamwork: 82, verification: 66 }, growth30d: 4, endorsements: 2, helped: 7,
    skills: ['react', 'node', 'sql', 'docker', 'api', 'git'],
    lookingFor: 'A hardware or ML team that needs a dashboard' },
  { id: 'p7', name: 'Grace Liu', initials: 'GL', major: 'Computer Science & Eng.', year: "'26", role: 'fullstack',
    scores: { technical: 90, shipping: 88, teamwork: 76, verification: 90 }, growth30d: 3, endorsements: 4, helped: 15,
    skills: ['typescript', 'react', 'node', 'sql', 'docker', 'cloud', 'testing', 'api', 'git'],
    lookingFor: 'Newer students to mentor (Rung 5)' },
  { id: 'p8', name: 'Noah Brooks', initials: 'NB', major: 'Electrical & Computer Eng.', year: "'28", role: 'robotics',
    scores: { technical: 62, shipping: 48, teamwork: 58, verification: 30 }, growth30d: 12, endorsements: 0, helped: 2,
    skills: ['cpp', 'python', 'linux', 'opencv'],
    lookingFor: 'A first team project' },
  { id: 'p9', name: 'Fatima Al-Sayed', initials: 'FA', major: 'Psychology (HCI minor)', year: "'27", role: 'ux',
    scores: { technical: 52, shipping: 60, teamwork: 80, verification: 62 }, growth30d: 15, endorsements: 1, helped: 10,
    skills: ['research', 'figma', 'dataviz'],
    lookingFor: 'A technical team that wants real user testing' },
]

// Projects in the Mentor Showcase feed. The student's own project is 'proj-me'.
export const SHOWCASE_PROJECTS = [
  { id: 'proj-me', ownerId: 'me', title: 'Buckeye Rover Lane Perception', ownerName: 'Jordan Patel', team: 'Jordan Patel + 3 (CSE, ECE, ME)',
    stack: ['Python', 'OpenCV', 'ROS 2'], repo: 'github.com/jpatel/rover-lanes', demoLength: '0:58',
    summary: 'Lane-line detection on a ROS 2 rover; 87% frame accuracy on the test track.',
    ai: { score: 74, strengths: ['Measured accuracy on a real track, not just a notebook', 'Clean ROS 2 node boundaries', 'Cross-major team of 4'],
      risks: ['No temporal smoothing: detections jitter frame-to-frame', 'No automated tests in repo'] },
    reviews: [] },
  { id: 'proj-p1', ownerId: 'p1', title: 'EKF Localization for Indoor Drone', ownerName: 'Maya Chen', team: 'Maya Chen (solo)',
    stack: ['C++', 'ROS 2', 'Gazebo'], repo: 'github.com/mchen/ekf-drone', demoLength: '1:24',
    summary: 'Extended Kalman filter fusing IMU + optical flow; 12 cm RMSE in Gazebo.',
    ai: { score: 82, strengths: ['Error plot vs. ground truth', 'Simulation harness included'], risks: ['Only validated in sim', 'README missing setup steps'] },
    reviews: [{ mentor: 'Rina Matsuda', stars: 4, note: 'Strong filter; next, validate on one real flight log.', endorse: true }] },
  { id: 'proj-p5', ownerId: 'p5', title: 'Campus Parking Demand Forecast', ownerName: 'Lena Kowalski', team: 'Lena Kowalski + 2 (Data Analytics, ISE)',
    stack: ['Python', 'scikit-learn', 'SQL'], repo: 'github.com/lkowalski/parking-forecast', demoLength: '1:10',
    summary: 'Gradient-boosted forecast of garage occupancy; MAPE 9.8% on a holdout month.',
    ai: { score: 71, strengths: ['Honest holdout evaluation', 'Clear dashboard'], risks: ['Features leak event-day info', 'No deployment'] },
    reviews: [] },
  { id: 'proj-p9', ownerId: 'p9', title: 'Driver Alert Usability Study', ownerName: 'Fatima Al-Sayed', team: 'Fatima Al-Sayed + Sam Whitaker',
    stack: ['Figma', 'User Research'], repo: 'figma.com/sample-case-study', demoLength: '1:45',
    summary: '8-participant study comparing 3 alert designs; reduced glance time in prototype tests.',
    ai: { score: 68, strengths: ['Real participants with a clear protocol', 'Design-to-engineering handoff notes'], risks: ['Small sample', 'No coded prototype yet'] },
    reviews: [] },
]

// Live opportunity feed the Action Engine pulls from (Handshake, OSU, platform).
export const EVENTS = [
  { id: 'e1', horizon: 'weekend', source: 'Handshake', kind: 'Hackathon', title: 'Sensor-Fusion Mini-Hack', when: 'Sun, Oct 25 · 10:00 AM–6:00 PM', where: 'Pomerene Hall', roles: ['robotics', 'ml'], closes: ['r-state', 'r-team', 'm-team'] },
  { id: 'e2', horizon: 'weekend', source: 'Handshake', kind: 'Company presentation', title: '99P Labs: How We Evaluate Student Projects', when: 'Sun, Oct 25 · 2:00–3:00 PM', where: 'Virtual', roles: ['robotics', 'ml', 'fullstack', 'ux'], closes: ['r-verify', 'm-verify', 'f-verify', 'u-verify'] },
  { id: 'e3', horizon: 'weekend', source: 'Handshake', kind: 'Hackathon', title: 'Design + Dev Weekend Build', when: 'Sat, Oct 24 · 1:00–9:00 PM', where: 'Thompson Library 11th floor', roles: ['fullstack', 'ux'], closes: ['f-team', 'u-team', 'u-code'] },
  { id: 'e4', horizon: 'week', source: 'OSU Student Org', kind: 'Workshop', title: 'ROS 2 + Gazebo Testing Workshop', when: 'Wed, Oct 28 · 7:00–8:30 PM', where: 'Dreese Labs 264', roles: ['robotics'], closes: ['r-sim', 'r-ros'] },
  { id: 'e5', horizon: 'week', source: 'Handshake', kind: 'Networking', title: 'Mobility & Autonomy Networking Night', when: 'Thu, Oct 29 · 6:00–8:00 PM', where: 'Ohio Union, Archie Griffin Ballroom', roles: ['robotics', 'ml', 'fullstack', 'ux'], closes: ['r-verify', 'm-verify', 'f-verify', 'u-verify'] },
  { id: 'e6', horizon: 'week', source: 'OSU Student Org', kind: 'Workshop', title: 'Deploying Models with Docker', when: 'Tue, Oct 27 · 6:30–8:00 PM', where: 'Scott Lab E0100', roles: ['ml', 'fullstack'], closes: ['m-deploy', 'f-ops'] },
  { id: 'e7', horizon: 'week', source: 'OSU Student Org', kind: 'Workshop', title: 'Usability Testing Crash Course', when: 'Mon, Oct 26 · 5:30–7:00 PM', where: 'Hopkins Hall 250', roles: ['ux'], closes: ['u-research'] },
]

export const OFFICE_HOURS = [
  { id: 'oh1', mentor: 'Rina Matsuda', initials: 'RM', title: 'Research Engineer, Honda Research Institute', topic: 'Perception & state estimation', when: 'Tue, Oct 27 · 4:00–4:15 PM', where: 'Virtual', roles: ['robotics', 'ml'], seats: 3 },
  { id: 'oh2', mentor: 'Marcus Hill', initials: 'MH', title: 'Software Engineer, 99P Labs', topic: 'Data pipelines & shipping demos', when: 'Thu, Oct 29 · 12:00–12:15 PM', where: 'Virtual', roles: ['ml', 'fullstack', 'robotics'], seats: 2 },
  { id: 'oh3', mentor: 'Elena Ruiz', initials: 'ER', title: 'UX Researcher, Honda Research Institute', topic: 'Human factors & in-car UX', when: 'Wed, Oct 28 · 3:30–3:45 PM', where: 'Virtual', roles: ['ux'], seats: 4 },
]

export const CURRENT_MENTOR = { name: 'Rina Matsuda', initials: 'RM', title: 'Research Engineer, Honda Research Institute' }
export const CURRENT_RECRUITER = { name: 'Jamie Cole', initials: 'JC', title: 'University Talent Partner, 99P Labs' }

export const QUICK_TAGS = ['Ship-ready', 'Needs tests', 'Great teamwork', 'Strong metrics', 'Scope down']
