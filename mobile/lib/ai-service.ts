const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

export interface GeneratedProject {
  name: string;
  problemStatement: string;
  features: string[];
  techStack: string[];
}

export const generateIdeaSpec = async (idea: string): Promise<GeneratedProject> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is missing. Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file.');
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-flash',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error from OpenRouter API');
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
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is missing.');
  }

  const prompt = `You are an expert Hackathon AI Mentor. You are chatting directly with a team of developers building a software project. 
They have tagged you for help with the following query:
"${query}"

Provide a concise, helpful, and technical response. If they are asking for code, provide small, accurate snippets. Keep your tone encouraging and professional.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-flash',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error from OpenRouter API');
    }

    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('AI Mentor Error:', error);
    return 'I encountered an error while trying to think. Please try asking again! (' + error.message + ')';
  }
};
