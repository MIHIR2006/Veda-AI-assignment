# VedaAI AI Powered Question Paper Generator

An intelligent assessment creation platform for educators designed for high scalability using BullMQ. VedaAI uses Google Gemini AI to generate customized question papers from topics lesson notes and configurable parameters all in real time.

---

## Tech Stack

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,express,mongodb,redis&theme=dark" alt="Tech Stack" />
  </a>
</p>

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | App router, SSR, component architecture |
| **Styling** | Tailwind CSS 4, Radix UI, Lucide Icons | Design system, accessible primitives, iconography |
| **State** | Zustand | Global state management for assignments and real-time status |
| **Forms** | React Hook Form, Zod | Form validation and schema-driven inputs |
| **Backend** | Node.js, Express 5, TypeScript | REST API, file handling, route management |
| **AI Engine** | Google Gemini 2.5 Flash | Question paper generation with multimodal support |
| **Queue** | BullMQ | Async job processing for AI generation tasks |
| **Database** | MongoDB, Mongoose | Persistent storage for assignments and generated papers |
| **Cache** | Redis, IORedis | Response caching and BullMQ job queue backend |
| **Real-time** | Socket.IO | Live progress updates during paper generation |
| **PDF** | react-to-print | Client-side PDF export of generated question papers |

---

## System Design

```
                          +------------------+
                          |   Next.js App    |
                          |   (Frontend)     |
                          |   Port: 3000     |
                          +--------+---------+
                                   |
                          REST API | Socket.IO
                                   |
                          +--------+---------+
                          |   Express Server |
                          |   (Backend)      |
                          |   Port: 8080     |
                          +--------+---------+
                                   |
                    +--------------+--------------+
                    |              |               |
              +-----+-----+ +----+----+   +------+------+
              |  MongoDB  | |  Redis  |   |   BullMQ    |
              |           | | (Cache) |   |   Worker    |
              +-----------+ +---------+   +------+------+
                                                 |
                                          +------+------+
                                          | Gemini 2.5  |
                                          | Flash API   |
                                          +-------------+
```

### Architecture Flow

```
1. User submits assignment config (topic, marks, difficulty, question types)
         |
2. Express API creates Assignment in MongoDB (status: pending)
         |
3. Job pushed to BullMQ queue (PaperGenerationQueue)
         |
4. Frontend joins Socket.IO room (jobId) for real-time updates
         |
5. BullMQ Worker picks up job, sends prompt to Gemini 2.5 Flash
         |
6. Gemini returns structured JSON (sections, questions, marks)
         |
7. Worker saves paper to MongoDB, emits AI_COMPLETE via Socket.IO
         |
8. Frontend receives paper in real-time, renders formatted output
         |
9. User can download as PDF or regenerate with one click
```

### API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/generate-paper` | Create assignment and queue AI generation |
| `GET` | `/api/assignments` | List all assignments (cached with Redis) |
| `GET` | `/api/assignments/:id` | Get single assignment with paper |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `POST` | `/api/assignments/:id/regenerate` | Regenerate paper for existing assignment |
| `GET` | `/api/health` | Health check endpoint |

---

## Features

### Core Features
- **AI Question Paper Generation** -- Generate complete, structured question papers from any topic using Gemini 2.5 Flash
- **Multimodal Input** -- Upload lesson notes as images or PDFs to generate context-aware questions
- **Configurable Parameters** -- Set topic, difficulty, marks, due date, question types (MCQ, Short Answer, Long Answer, etc.)
- **Real-time Generation** -- Live progress tracking via WebSockets while AI generates the paper
- **PDF Export** -- Download generated question papers as formatted A4 PDFs
- **Regeneration** -- One-click regenerate to get a fresh set of questions

### Assignment Management
- **Assignment Dashboard** -- View all assignments in a responsive card grid
- **Search and Filter** -- Search assignments by topic, sort by newest, oldest, or due date
- **CRUD Operations** -- Create, view, and delete assignments
- **Status Tracking** -- Visual status badges (Completed, Generating, Failed)

### Pages
- **Home** -- Dashboard with stats overview (total assignments, completed, in progress), AI hero banner, and recent assignments
- **Assignments** -- Full assignment management with search, filter, and card grid
- **Create Assignment** -- Multi-step form with file upload, topic input, date picker, and question type configurator
- **Assignment Output** -- Rendered question paper with download and regenerate actions
- **AI Teacher's Toolkit** -- Feature grid showcasing available and upcoming AI tools
- **My Groups** -- Coming soon preview with feature roadmap cards
- **My Library** -- Generated papers archive with templates and resources placeholders
- **Settings** -- Profile info, school details, and preference toggles

### UI/UX
- **Custom Typography** -- Bricolage Grotesque (ExtraBold 800) for headers, DM Sans for body
- **Floating Layout** -- Sidebar and navbar with rounded corners and margins, creating a modern floating aesthetic
- **Responsive Design** -- Optimized for desktop and mobile with adaptive card sizes and layouts
- **Animated Transitions** -- Fade-in animations, hover effects, and micro-interactions
- **Toast Notifications** -- Sonner-powered feedback for user actions
- **Profile Dropdown** -- Quick access to GitHub, Portfolio, and LinkedIn links

---

## Project Structure

```
Veda-AI-assignment/
|
|-- Backend/
|   |-- src/
|   |   |-- config/
|   |   |   |-- db.ts              # MongoDB connection
|   |   |-- models/
|   |   |   |-- Assignment.ts      # Mongoose schema (topic, marks, paper, status)
|   |   |-- routes/
|   |   |   |-- api.ts             # REST endpoints + BullMQ queue
|   |   |-- workers/
|   |   |   |-- consumer.ts        # BullMQ worker + Gemini AI integration
|   |   |-- index.ts               # Express + Socket.IO server setup
|   |-- package.json
|   |-- tsconfig.json
|
|-- Frontend/
|   |-- app/
|   |   |-- page.tsx               # Home dashboard
|   |   |-- layout.tsx             # Root layout (fonts, providers)
|   |   |-- assignments/
|   |   |   |-- page.tsx           # Assignment list
|   |   |   |-- create/page.tsx    # Create assignment form
|   |   |   |-- [id]/page.tsx      # Assignment output view
|   |   |-- groups/page.tsx        # Groups (coming soon)
|   |   |-- toolkit/page.tsx       # AI Toolkit feature grid
|   |   |-- library/page.tsx       # My Library
|   |   |-- settings/page.tsx      # Settings page
|   |-- components/
|   |   |-- layout/
|   |   |   |-- AppLayout.tsx      # Main layout wrapper
|   |   |   |-- AppSidebar.tsx     # Navigation sidebar
|   |   |   |-- TopBar.tsx         # Top navigation bar
|   |   |-- ui/                    # Radix-based UI primitives
|   |   |-- EmptyState.tsx         # Reusable empty state component
|   |   |-- providers.tsx          # Theme + query providers
|   |-- store/
|   |   |-- assignmentStore.ts     # Zustand store (assignments, socket, jobs)
|   |-- public/assets/             # Logo, illustrations
|   |-- package.json
|   |-- tailwind.config.ts
|
|-- README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Google Gemini API key

### Environment Variables

**Backend** (`Backend/.env`):
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`Frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Installation

```bash
# Clone the repository
git clone https://github.com/MIHIR2006/Veda-AI-assignment.git
cd Veda-AI-assignment

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Running the Application

```bash
# Terminal 1: Start the backend
cd Backend
npm run dev

# Terminal 2: Start the frontend
cd Frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

1. Navigate to **Create Assignment** from the sidebar or home page
2. Upload lesson notes (optional) -- supports images and PDFs
3. Fill in the topic, due date, and additional instructions
4. Configure question types with count and marks per type
5. Click **Generate** -- the backend queues a BullMQ job
6. Watch real-time progress as Gemini AI creates your paper
7. Review the formatted question paper on the output page
8. **Download as PDF** or **Regenerate** for a fresh version

---

## Author

**Mihir Goswami**

- GitHub: [github.com/MIHIR2006](https://github.com/MIHIR2006)
- Portfolio: [mihirgoswami.is-a.dev](https://mihirgoswami.is-a.dev)
- LinkedIn: [linkedin.com/in/mihir-goswami](https://www.linkedin.com/in/mihir-goswami/)

---
