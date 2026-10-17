# AI_LOG.md

## Small backend increment: login rate limit — 2026-10-17

**Tool(s) used:** Codex, NestJS guard documentation, local test tools.
**What I asked for:** Add a small useful backend mechanism for the next contribution.
**What I kept as-is:** Existing authentication and database schema.
**What I changed or rejected, and why:** Added only a per-IP login request limit with 429/Retry-After, unit and integration checks, and API documentation. No new business features or database migration.
**Something the AI got wrong that I had to catch:** No user correction recorded for this increment. The implementation explicitly documents single-process and shared-IP limitations.

## Scope correction: start with accounts only — 2026-10-13

**Tool(s) used:** Codex and local PostgreSQL.
**What I asked for:** Undo the oversized implementation and start with database connection, users/students, signup, login and logout.
**What I kept as-is:** PostgreSQL connection and secure password/session handling.
**What I changed or rejected, and why:** Removed report/chat code, their active migrations, benchmark plan and unused setup/testing dependencies. Created a fresh small database; preserved the old database and a dump under ignored .local/previous-scope. Earlier entries below describe work now superseded by this smaller scope.
**Something the AI got wrong that I had to catch:** The assistant implemented too many features at once for a project with two months remaining. I asked for smaller, understandable increments.

## Local PostgreSQL and REST API implementation — 2026-10-13

**Tool(s) used:** Codex, official PostgreSQL/EDB and NestJS documentation, Node.js, local PostgreSQL 17.11.
**What I asked for:** Prepare local PostgreSQL, apply migrations and build APIs on the agreed schema.
**What I kept as-is:** NestJS and PostgreSQL; existing frontend left for subsequent integration.
**What I changed or rejected, and why:** Added portable PostgreSQL, private generated credentials, a separate test database, persistent auth sessions, report APIs and chat storage APIs. Disabled placeholder Observe instrumentation. Added real PostgreSQL HTTP integration tests rather than relying only on embedded schema checks.
**Something the AI got wrong that I had to catch:** During implementation, a test connection URL was initially generated with a broad string replacement that also changed the username. Codex corrected it with URL pathname parsing before rerunning the passing integration test; no user intervention was claimed.

## Local PostgreSQL schema and benchmark preparation — 2026-10-13

**Tool(s) used:** Codex, terminal, official PostgreSQL and PGlite documentation.
**What I asked for:** Connect PostgreSQL, define tables including chat, and prioritize a working backend with measured performance before large-scale claims.
**What I kept as-is:** NestJS, relational business data, and existing demo endpoints.
**What I changed or rejected, and why:** Replaced the unapplied Supabase-specific schema with local PostgreSQL migrations; added chat membership/retry constraints, setup documentation and a benchmark plan. No million-RPS claim is made.
**Something the AI got wrong that I had to catch:** The initial local-versus-cloud recommendation was too quick; further discussion separated database size, concurrency and request throughput. Live database setup still depends on an available PostgreSQL server.

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

**My contribution:** I provided the assignment requirements and the existing project as the basis for planning, reviewed the explanation of each homework requirement, and requested revisions to the documentation. I remain responsible for implementing the selected tasks and checking their results.

**AI support:** Codex inspected the repository, proposed backlog priorities and estimates, drafted the sprint document, and created the labeled GitHub Issues.

**What I kept as-is:** The CampusFind product vision, solo-project scope, Next.js frontend and separate NestJS backend.

**What I changed or rejected, and why:** The sprint scope was narrowed to API-backed browsing and the report detail/navigation flow to fit one week. Persistent posting, production authentication, image uploads and deployment were deferred. Detailed checks and estimates are recorded in `SPRINT_01.md`.

**Something the AI got wrong that I had to catch:** The initial AI log included unnecessary review reminders and process commentary. I asked for a shorter entry focused on the required fields.

## English documentation correction — 2026-10-17

**Tool(s) used:** Codex.
**What I asked for:** Keep project content in English and leave commits and pushes to me.
**What I kept as-is:** API behavior, schema and application logic.
**What I changed or rejected, and why:** Translated backend API/setup documentation and the remaining Vietnamese frontend comments. Unstaged the previously prepared full-project addition; no commit or push was performed in this correction.
**Something the AI got wrong that I had to catch:** The assistant had written project documentation in Vietnamese. I clarified that project content must be in English and that I will handle future pushes myself.
