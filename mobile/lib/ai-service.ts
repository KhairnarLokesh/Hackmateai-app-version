// Using Hugging Face Inference API (Free, no account needed for basic models)
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const USE_MOCK_AI = !OPENROUTER_API_KEY; // Use mock if no API key

export interface GeneratedProject {
  name: string;
  problemStatement: string;
  features: string[];
  techStack: string[];
}

export const generateIdeaSpec = async (idea: string): Promise<GeneratedProject> => {
  // If no API key, use mock data
  if (USE_MOCK_AI) {
    console.log('⚠️ No API key found, using mock AI response');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    return {
      name: idea.split(' ').slice(0, 3).join(' ') + ' App',
      problemStatement: `A solution to help users with ${idea.toLowerCase()}. This app aims to streamline the process and make it more accessible.`,
      features: [
        'User authentication and profiles',
        'Real-time data synchronization',
        'Intuitive dashboard interface',
        'Mobile-responsive design',
        'Push notifications',
      ],
      techStack: ['React Native', 'Firebase', 'TypeScript', 'Expo'],
    };
  }

  const prompt = `You are an expert Hackathon AI Mentor. The user has an idea for a project: "${idea}".
Please generate a structured project specification for this idea.
Return the result strictly as a JSON object with the following structure (do not include markdown block formatting, just the raw JSON):
{
  "name": "A catchy, short name for the project",
  "problemStatement": "A 1-2 sentence description of the problem it solves",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "techStack": ["Technology 1", "Technology 2", "Technology 3"]
}`;

  try {
    console.log('🔑 API Key present:', OPENROUTER_API_KEY ? 'Yes' : 'No');
    console.log('🔑 API Key length:', OPENROUTER_API_KEY?.length);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hackmate-ai.app',
        'X-Title': 'HackMate AI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || data.message || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    
    // Parse the JSON. Sometimes the LLM wraps it in ```json ... ``` despite instructions.
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }
    
    return JSON.parse(jsonStr.trim());
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    throw new Error('Failed to generate project specification: ' + error.message);
  }
};

export const askAiMentor = async (query: string): Promise<string> => {
  // If no API key, use mock response
  if (USE_MOCK_AI) {
    console.log('⚠️ No API key found, using mock AI Mentor response');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    return `I'm currently running in demo mode. To get real AI assistance, please add a valid OpenRouter API key to your .env file.\n\nYour question was: "${query}"\n\nIn the meantime, here are some general tips:\n- Break down your problem into smaller steps\n- Check the documentation for your framework\n- Use console.log() to debug issues\n- Ask your team members for help!`;
  }

  const prompt = `You are an expert Hackathon AI Mentor. You are chatting directly with a team of developers building a software project. 
They have tagged you for help with the following query:
"${query}"

Provide a concise, helpful, and technical response. If they are asking for code, provide small, accurate snippets. Keep your tone encouraging and professional.`;

  try {
    console.log('🤖 AI Mentor - API Key present:', OPENROUTER_API_KEY ? 'Yes' : 'No');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hackmate-ai.app',
        'X-Title': 'HackMate AI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log('🤖 AI Mentor - Response status:', response.status);
    const data = await response.json();
    console.log('🤖 AI Mentor - Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || data.message || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('AI Mentor Error:', error);
    return 'I encountered an error while trying to think. Please try asking again! (' + error.message + ')';
  }
};

export interface GeneratedTask {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  effort: 'Low' | 'Medium' | 'High';
}

export const generateTasks = async (projectName: string, features: string[]): Promise<GeneratedTask[]> => {
  if (USE_MOCK_AI) {
    await new Promise(r => setTimeout(r, 1200));
    return [
      { title: 'Set up project repository', description: 'Initialize git repo and folder structure', priority: 'High', effort: 'Low' },
      { title: 'Design database schema', description: 'Plan and create all data models', priority: 'Critical', effort: 'Medium' },
      { title: 'Build authentication flow', description: 'Sign-up, login, and session management', priority: 'High', effort: 'High' },
      { title: 'Create main UI screens', description: 'Design and implement core app screens', priority: 'Medium', effort: 'High' },
      { title: 'Write API endpoints', description: 'Backend routes for core functionality', priority: 'High', effort: 'High' },
      { title: 'Prepare demo presentation', description: 'Slides and demo script for judging', priority: 'Critical', effort: 'Medium' },
    ];
  }

  const prompt = `You are a hackathon project manager. Project: "${projectName}". Features: ${features.join(', ')}.
Generate 6-8 specific development tasks. Return ONLY a raw JSON array, no markdown fences:
[{"title":"Task title","description":"One sentence","priority":"High","effort":"Medium"}]
Priority: Low|Medium|High|Critical. Effort: Low|Medium|High.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hackmate-ai.app',
        'X-Title': 'HackMate AI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'API error');
    let content = data.choices[0].message.content.trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error('Failed to generate tasks: ' + error.message);
  }
};

export interface GeneratedTasksAndProblem {
  problemStatement: string;
  tasks: GeneratedTask[];
}

export const generateProblemAndTasks = async (projectName: string): Promise<GeneratedTasksAndProblem> => {
  if (USE_MOCK_AI) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      problemStatement: `A mock problem statement for ${projectName}. This project solves various issues related to it.`,
      tasks: [
        { title: 'Set up project repository', description: 'Initialize git repo and folder structure', priority: 'High', effort: 'Low' },
        { title: 'Design database schema', description: 'Plan and create all data models', priority: 'Critical', effort: 'Medium' },
      ]
    };
  }

  const prompt = `You are a hackathon project manager. The user has given a project idea or name: "${projectName}".
Generate a brief problem statement for this project AND 6-8 specific development tasks.
Return ONLY a raw JSON object, no markdown fences. The JSON must exactly match this structure:
{
  "problemStatement": "A 1-2 sentence description of the problem this solves.",
  "tasks": [
    {"title":"Task title","description":"One sentence","priority":"High","effort":"Medium"}
  ]
}
Priority must be one of: Low, Medium, High, Critical.
Effort must be one of: Low, Medium, High.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hackmate-ai.app',
        'X-Title': 'HackMate AI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'API error');
    let content = data.choices[0].message.content.trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error('Failed to generate problem and tasks: ' + error.message);
  }
};

export interface PitchDeckResponse {
  pitchDeck: string;
  mermaidDiagram: string;
}

export const generatePitchDeck = async (projectName: string, problemStatement: string, features: string[], tasks: any[]): Promise<PitchDeckResponse> => {
  if (USE_MOCK_AI) {
    await new Promise(r => setTimeout(r, 1500));
    return {
      pitchDeck: `# Pitch Deck: ${projectName}

## Slide 1: The Hook
Welcome to ${projectName}! Are you tired of dealing with [insert problem]? We have the solution.

## Slide 2: The Problem
${problemStatement}

## Slide 3: Our Solution
We built an app with the following features:
${features.map(f => '- ' + f).join('\n')}

## Slide 4: Development & Architecture
We successfully implemented the following tasks during this hackathon:
${tasks.map(t => '- ' + t.title).join('\n')}

## Slide 5: Future Roadmap
- Launch beta version
- Gather user feedback
- Expand feature set`,
      mermaidDiagram: `graph TD;
  Client[Mobile App] --> Auth[Firebase Auth];
  Client --> DB[(Firestore DB)];
  Client --> API[OpenRouter AI];`
    };
  }

  const prompt = `You are a startup advisor helping a team present their hackathon project.
Project Name: "${projectName}"
Problem Statement: "${problemStatement}"
Features: ${features.join(', ')}
Completed/Planned Tasks: ${tasks.map(t => t.title).join(', ')}

Please generate a compelling, well-structured 5-slide presentation outline in Markdown format.
Slide 1: The Hook / Title
Slide 2: The Problem
Slide 3: Our Solution
Slide 4: Architecture & What We Built
Slide 5: Future Roadmap / Next Steps

ALSO, generate a Mermaid.js diagram representing the system architecture based on the features and tasks. Use standard Mermaid graph syntax.

Return your response EXACTLY in this format (no JSON, just the raw text with these delimiters):
===PITCH DECK===
(your markdown outline here)
===MERMAID===
(your mermaid graph here)`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hackmate-ai.app',
        'X-Title': 'HackMate AI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'API error');
    
    const rawContent = data.choices[0].message.content.trim();
    
    let pitchDeck = rawContent;
    let mermaidDiagram = '';
    
    const parts = rawContent.split(/===\s*MERMAID\s*===/i);
    if (parts.length > 1) {
      pitchDeck = parts[0].replace(/===\s*PITCH DECK\s*===/i, '').trim();
      mermaidDiagram = parts[1].replace(/```mermaid/gi, '').replace(/```/g, '').trim();
    }
    
    return { pitchDeck, mermaidDiagram };
  } catch (error: any) {
    throw new Error('Failed to generate pitch deck: ' + error.message);
  }
};

