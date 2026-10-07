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

**Tool(s) used:** Codex, VS Code, Git and GitHub.

**What I asked for:** Review the current CampusFind code and help prepare a one-week sprint plan, including GitHub Issues, priorities, acceptance checks, task estimates and a Definition of Done.

**What I kept as-is:** The CampusFind product vision, solo-project scope, Next.js frontend and separate NestJS backend.

**What I changed or rejected, and why:** The sprint scope was narrowed to API-backed browsing and the report detail/navigation flow to fit one week. Persistent posting, production authentication, image uploads and deployment were deferred. Detailed checks and estimates are recorded in `SPRINT_01.md`.

**Something the AI got wrong that I had to catch:** The initial AI log included unnecessary review reminders and process commentary. I asked for a shorter entry focused on the required fields.
