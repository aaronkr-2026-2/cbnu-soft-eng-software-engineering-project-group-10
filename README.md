# PRODUCT VISION

CampusFind aims to provide university students with a simple, centralized, and reliable platform for reporting and recovering lost belongings on campus.

Instead of relying on scattered information from KakaoTalk groups, social media, university communities, or physical notice boards, CampusFind brings lost-and-found information into one searchable system.

The product is designed to help students quickly:

- Report lost or found items
- Search existing lost-and-found posts
- Filter items by status, category, and location
- View detailed information about an item
- Contact the owner or finder
- Mark an item as recovered once it has been returned

The long-term vision of CampusFind is to become a practical campus service that reduces the time and effort required to recover lost belongings while encouraging cooperation among students and university staff.

In future versions, CampusFind may also provide an intelligent matching system that suggests possible matches between lost and found posts based on item category, location, date, and keywords.

# software-project

Team Software Engineering Projects

Collect all your software engineering project files, resources, etc here.

## `AI_LOG.md`

Every time you update your project, please make a note of what you did in the `AI_LOG.md` file, according to the following template.

```markdown
## [Milestone name] — [Date]
**Tool(s) used:**
**What I asked for:**
**What I kept as-is:**
**What I changed or rejected, and why:**
**Something the AI got wrong that I had to catch:**
```

**Tool(s) used:**  
ChatGPT, VS Code, Next.js + Tailwind CSS for FE and Nest.js for BE; both tools used TypeScript.

**What I asked for:**  
I used ChatGPT to help organize my CampusFind project idea, define the MVP, choose the tech stack, and create a simple development plan. I also asked it to help me create a first demo homepage UI, which I may change the homepage to be more suitable and more optimal.

**What I kept as-is:**  
I kept the main idea of a campus lost-and-found platform and the core features such as login, lost/found posts, search, filters, item details, and recovered status. I also kept the suggested homepage sections and used mock data first to build the UI.

**What I changed or rejected, and why:**  
I kept the item-matching feature as optional because it may take too much time for a 2–3 week solo project. I also decided not to add unnecessary libraries or complicated state management at the beginning.

**Something the AI got wrong that I had to catch:**  
The AI used the term "Nest.js API Routes" for the backend. I noticed that this was inaccurate because Next.js has API Routes, while NestJS should be used as a separate backend API framework. I corrected the stack to Next.js for the frontend and NestJS for the backend.
