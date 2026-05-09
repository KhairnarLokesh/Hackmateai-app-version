<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</div>

<h1 align="center">🚀 HackMate AI</h1>

<p align="center">
  <strong>The Ultimate AI-Powered Mobile Companion for Hackathons.</strong><br>
  Generate project specifications, manage your team's kanban board, and chat in real-time with an integrated AI Mentor.
</p>

---

## ✨ Features

- **🧠 AI Idea Lab**: Pitch a raw idea and instantly generate a structured technical specification (Problem Statement, Features, Tech Stack) powered by Google Gemini (via OpenRouter).
- **⚡ Live Kanban Board**: A touch-friendly, mobile-first project management board. Organize tasks seamlessly into To-Do, In Progress, and Done.
- **💬 Real-Time Team Chat**: Communicate instantly with your team via Firebase real-time data syncing.
- **🤖 Integrated AI Mentor**: Tag `@ai` or `@mentor` directly in the team chat to instantly summon an expert coding assistant for debugging help and code snippets.
- **🔐 Secure Team Workspaces**: Authenticate users and group them into isolated team workspaces powered by Firebase Auth and Firestore.
- **🎨 Premium UI/UX**: Built with a stunning dark-mode glassmorphic aesthetic using Expo Blur and Linear Gradients.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: Vanilla React Native StyleSheet + Expo Blur
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Backend & DB**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **AI Integration**: [OpenRouter API](https://openrouter.ai/) (Google Gemini 2.5 Flash)

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A Firebase Project (with Firestore and Auth enabled)
- An OpenRouter API Key

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/KhairnarLokesh/Hackmateai-app-version.git
cd Hackmateai-app-version/mobile
npm install
```

### 3. Environment Variables
Create a `.env` file in the `mobile/` directory and add your keys:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Run the App
```bash
npx expo start -c
```
Scan the QR code with the **Expo Go** app on your phone to see it live!

---

## 📸 Core Workflows

1. **Onboarding**: Users authenticate and are assigned to their team's workspace.
2. **Dashboard**: View all active projects and an AI insight banner.
3. **Idea Generation**: Tap "Create Project", enter an idea, and watch the AI instantly generate a beautiful project brief.
4. **Task Management**: Tap into a project to manage tasks via the tap-to-move Kanban UI.
5. **Mentorship**: Navigate to the Chat tab and type `@ai how do I fix a react-native flexbox issue?` to get live help.

---

<div align="center">
  <i>Built for Hackers, by Hackers.</i>
</div>
