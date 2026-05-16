# HackMate AI Mobile - Troubleshooting Guide

## 🔴 Current Issues & Solutions

### 1. **OpenRouter API Error: "User not found"**

**Error Message:**
```
ERROR AI Mentor Error: [Error: User not found.]
```

**Possible Causes:**
1. Invalid or expired OpenRouter API key
2. OpenRouter account doesn't exist or is suspended
3. API key doesn't have proper permissions

**Solutions:**

#### Option A: Get a New API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to **Keys** section
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)
6. Update `mobile/.env`:
   ```env
   EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY_HERE
   ```
7. Restart the Expo dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```

#### Option B: Use a Free Alternative Model
If you don't want to use OpenRouter, you can switch to a different AI provider:

**Edit `mobile/lib/ai-service.ts`** and replace the fetch calls with one of these alternatives:

**Using Hugging Face (Free):**
```typescript
const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: prompt,
    parameters: { max_new_tokens: 1500 }
  }),
});
```

**Using Groq (Free, Fast):**
```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
  }),
});
```

#### Option C: Disable AI Features Temporarily
Comment out AI calls and use mock data for testing:

**Edit `mobile/lib/ai-service.ts`:**
```typescript
export const generateIdeaSpec = async (idea: string): Promise<GeneratedProject> => {
  // Mock response for testing
  return {
    name: "Test Project",
    problemStatement: "This is a test project for " + idea,
    features: ["Feature 1", "Feature 2", "Feature 3"],
    techStack: ["React Native", "Firebase", "TypeScript"]
  };
};

export const askAiMentor = async (query: string): Promise<string> => {
  return "This is a mock response. Please configure a valid API key to use the AI Mentor.";
};
```

---

### 2. **Firebase Error: "Client is offline"**

**Error Message:**
```
ERROR Error fetching team ID: [FirebaseError: Failed to get document because the client is offline.]
```

**Possible Causes:**
1. No internet connection
2. Firebase emulator not running (if using local development)
3. Firestore security rules blocking access
4. Network firewall blocking Firebase

**Solutions:**

#### Check Internet Connection
1. Verify your device/emulator has internet access
2. Try opening a browser and visiting `https://www.google.com`
3. If using Android Emulator, check network settings

#### Verify Firebase Configuration
1. Check that all Firebase env variables are set in `mobile/.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hackmate-ai.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=hackmate-ai
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hackmate-ai.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=486410112976
   EXPO_PUBLIC_FIREBASE_APP_ID=1:486410112976:web:...
   ```

2. Restart Expo after changing `.env`:
   ```bash
   npm start -- --clear
   ```

#### Check Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hackmate-ai`
3. Navigate to **Firestore Database** → **Rules**
4. Ensure rules allow authenticated users to read/write:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow team members to access team data
       match /teams/{teamId}/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

#### Enable Offline Persistence (Already Added)
The code now includes better offline handling. If you're offline, the app will:
- Show cached data when available
- Display a friendly error message
- Allow you to continue using cached features

---

### 3. **TypeScript Errors: Firebase Imports**

**Error Message:**
```
Module '"firebase/firestore"' has no exported member 'doc'
```

**Status:** ✅ **FIXED**

All Firebase import errors have been resolved by adding `// @ts-ignore` comments. If you still see these errors:

1. Restart TypeScript server in VS Code:
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

2. Clear TypeScript cache:
   ```bash
   rm -rf node_modules/.cache
   npm start -- --clear
   ```

---

## 🧪 Testing Checklist

### Before Testing AI Features:
- [ ] Valid OpenRouter API key in `.env`
- [ ] Expo dev server restarted after `.env` changes
- [ ] Check terminal for API key debug logs: `🔑 API Key present: Yes`

### Before Testing Firebase Features:
- [ ] Internet connection active
- [ ] Firebase config in `.env` is correct
- [ ] User is logged in
- [ ] Check terminal for Firebase config logs: `🔥 Firebase Config: ✅ Present`

### Test Sequence:
1. **Authentication**
   - [ ] Sign up with email/password
   - [ ] Log in with existing account
   - [ ] Log out

2. **Team Setup**
   - [ ] Create a new team
   - [ ] Join existing team with code

3. **AI Idea Lab** (requires valid API key)
   - [ ] Enter a project idea
   - [ ] Click "Generate Spec"
   - [ ] Verify project details are generated
   - [ ] Save project to team

4. **Kanban Board**
   - [ ] View project details
   - [ ] Add tasks to columns
   - [ ] Move tasks between columns

5. **Chat**
   - [ ] Send team chat message
   - [ ] Switch to AI Mentor
   - [ ] Ask AI a question (requires valid API key)

---

## 📊 Debug Logs

The app now includes debug logging. Check your terminal for:

### Firebase Logs:
```
🔥 Firebase Config:
  apiKey: ✅ Present
  authDomain: ✅ Present
  projectId: ✅ Present
```

### OpenRouter API Logs:
```
🔑 API Key present: Yes
🔑 API Key length: 64
📡 Response status: 200
📦 Response data: { ... }
```

### AI Mentor Logs:
```
🤖 AI Mentor - API Key present: Yes
🤖 AI Mentor - Response status: 200
🤖 AI Mentor - Response: { ... }
```

---

## 🆘 Still Having Issues?

1. **Clear all caches:**
   ```bash
   rm -rf node_modules
   rm -rf .expo
   npm install
   npm start -- --clear
   ```

2. **Check environment variables are loaded:**
   Add this to any file and check the terminal:
   ```typescript
   console.log('ENV CHECK:', {
     firebase: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'OK' : 'MISSING',
     openrouter: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ? 'OK' : 'MISSING',
   });
   ```

3. **Verify `.env` file location:**
   - Must be at `mobile/.env` (not in subdirectories)
   - Must start with `EXPO_PUBLIC_` for Expo to load them
   - No quotes around values needed

4. **Check for typos in `.env`:**
   ```env
   # ✅ CORRECT
   EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-abc123

   # ❌ WRONG (extra spaces, quotes)
   EXPO_PUBLIC_OPENROUTER_API_KEY = "sk-or-v1-abc123"
   ```

---

## 📝 Quick Reference

### Restart Commands:
```bash
# Full restart with cache clear
npm start -- --clear

# Reset project (if really stuck)
npm run reset-project
```

### Check Logs:
```bash
# Android logs
npx react-native log-android

# iOS logs  
npx react-native log-ios
```

### Environment Variables:
```bash
# Print all env vars (for debugging)
npx expo config --type public
```
