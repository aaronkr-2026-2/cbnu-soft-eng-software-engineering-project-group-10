# AI_LOG.md

Every time you update your project, please make a note of what you did in the `AI_LOG.md` file, according to the following template.

---

## [Milestone name] — [Date]
**Tool(s) used:**
**What I asked for:**
**What I kept as-is:**
**What I changed or rejected, and why:**
**Something the AI got wrong that I had to catch:**

---
Tool(s) used:
ChatGPT, VS Code, Next.js + Tailwind CSS for FE and Nest.js for BE; both tools used TypeScript.

What I asked for:
I used ChatGPT to help organize my CampusFind project idea, define the MVP, choose the tech stack, and create a simple development plan. I also asked it to help me create a first demo homepage UI, which I may change the homepage to be more suitable and more optimal.

What I kept as-is:
I kept the main idea of a campus lost-and-found platform and the core features such as login, lost/found posts, search, filters, item details, and recovered status. I also kept the suggested homepage sections and used mock data first to build the UI.

What I changed or rejected, and why:
I kept the item-matching feature as optional because it may take too much time for a 2–3 week solo project. I also decided not to add unnecessary libraries or complicated state management at the beginning.

Something the AI got wrong that I had to catch:
The AI used the term "Nest.js API Routes" for the backend. I noticed that this was inaccurate because Next.js has API Routes, while NestJS should be used as a separate backend API framework. I corrected the stack to Next.js for the frontend and NestJS for the backend.

---

## Sprint 01 planning and repository diagnosis — 2026-10-07

**Tool(s) used:** Codex, local source inspection, Git, GitHub REST API, npm/ESLint/Vitest/Nest build commands.

**What I asked for:** Independently inspect the CampusFind repository and prepare the sprint-planning homework from the lecture slides: a one-week goal, prioritized labeled issues, two refined items, small tasks, check-ins and a Definition of Done.

**What I kept as-is:** The existing product vision, solo-project structure, Next.js frontend and separate NestJS backend. Application source code was not changed by this planning task.

**Verification and artifacts:** Created `SPRINT_01.md`, linked it from README, and published six labeled GitHub issues (#2–#7). Backend build passed; the existing unit test timed out in setup; frontend lint was stopped without a result. The plan records these limitations and does not claim implementation acceptance checks have passed.

**What I changed or rejected, and why:** The AI-generated plan prioritizes API-backed browsing and broken detail/navigation instead of adding five new features. It explicitly treats the existing login/tasks code as a demo and postpones persistent posting, real authentication, uploads and deployment. Proposed capacity is 16 person-hours (14 planned plus 2 contingency); dates and capacity are assumptions to review, not a confirmed personal schedule.

**Something the AI got wrong that I had to catch:** No new student-caught AI error has been reported in this interaction. This entry was drafted by AI from the actual interaction; the student should review the plan and record any later corrections honestly.
