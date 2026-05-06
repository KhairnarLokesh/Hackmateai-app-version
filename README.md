<div align="center">
  <img src="https://raw.githubusercontent.com/KanhaiyaBagul/HactMate-AI/main/public/hackmate-hero.png" alt="HackMate AI Banner" width="800">

  # 🚀 HackMate AI
  ### *Empowering Hackathon Teams with AI-Driven Execution*

  [![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
  [![Gemini AI](https://img.shields.io/badge/Google_Gemini-Powered-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

  [**Explore the Demo**](https://hackmate-ai.vercel.app/) • [**Join the Community**](https://github.com/KanhaiyaBagul/HactMate-AI) • [**Report a Bug**](https://github.com/KanhaiyaBagul/HactMate-AI/issues)

</div>

---

## 🌟 Vision
**HackMate AI** isn't just another task manager. It's a specialized **AI Co-pilot** for the intense, sleep-deprived environment of 24h and 48h hackathons. It bridges the gap between a "cool idea" and a "winning project" by automating the heavy lifting of project management and technical scoping.

---

## 🛠️ Feature Ecosystem

| Feature | Description | Core Technology |
| :--- | :--- | :--- |
| **🧠 AI Idea Lab** | Converts fragmented thoughts into a full technical specification, complete with feature lists and risk mitigations. | Google Gemini 1.5 Pro |
| **⚡ Instant Backlog** | One-click generation of 10+ actionable tasks with effort estimation and priority tagging. | Gemini Task Generator |
| **🛰️ Live Sync** | Real-time multi-user collaboration. Every move on the board is instantly visible to all team members. | Firebase Firestore |
| **💬 AI Mentor** | An embedded mentor that provides technical advice, pitch feedback, and helps with "scope cutting" as the deadline nears. | LLM-based RAG |
| **📊 Project Vitality** | Visual analytics showing project health, task velocity, and GitHub activity feeds. | Recharts & GitHub API |
| **🎬 Presentation Mode** | A polished, read-only view designed for the final judging pitch. | Next.js Dynamic Views |

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Team Member]) -->|Next.js App| Frontend[Frontend Layer]
    Frontend -->|Auth & Sync| Firebase{Firebase Platform}
    Frontend -->|API Requests| Backend[Serverless API Routes]
    Backend -->|Actionable Prompts| AI[Gemini / OpenRouter]
    Firebase -->|Storage| Firestore[(Firestore DB)]
    AI -->|Generated Plan/Tasks| Backend
    Backend -->|JSON Response| Frontend
    GithubAPI[GitHub Repos] -->|History Fetch| Frontend
```

---

## 🚀 Deployment & Installation

### Core Stack
- **Framework**: [Next.js 14-16 (App Router)](https://nextjs.org/)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **AI Integration**: [OpenRouter / Gemini Pro](https://openrouter.ai/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)

### Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/KanhaiyaBagul/HactMate-AI.git && cd hackmate-ai
   npm install
   ```

2. **Environment Configuration**
   Populate your `.env.local` with your Firebase and AI credentials.
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   OPENROUTER_API_KEY="..."
   ```

3. **Launch**
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap
- [ ] **Multi-Repo Integration**: Track multiple GitHub repos for larger teams.
- [ ] **AI-Generated Diagrams**: Generate Mermaid diagrams automatically from project ideas.
- [ ] **Discord/Slack Webhooks**: Real-time notifications for task completions.
- [ ] **Mobile Native**: PWA or React Native companion app for quick updates.

---

<div align="center">
  <p>Built for the <b>build-fast</b> generation.</p>
  <a href="https://github.com/KanhaiyaBagul">
    <img src="https://img.shields.io/badge/Follow%20the%20Author-@KanhaiyaBagul-blue?style=flat-square&logo=github" alt="Follow Kanhaiya Bagul">
  </a>
</div>
