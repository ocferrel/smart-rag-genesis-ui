
import { ModelType, OpenRouterResponse } from "@/types";

// Function to process images for OpenRouter
export const processImageForOpenRouter = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// OpenRouter API key from localStorage or use the provided one
const getApiKey = (): string => {
  const savedKey = localStorage.getItem("openrouter_api_key");
  return savedKey || "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";
};

// Function to call OpenRouter API
export const callOpenRouter = async (
  apiKey: string = getApiKey(), 
  messages: { role: "system" | "user" | "assistant"; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[],
  model: ModelType = 'google/gemini-2.5-pro-exp-03-25:free',
  temperature: number = 0.7,
  maxTokens: number = 1024
): Promise<OpenRouterResponse> => {
  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Lovable ChatRAG'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  return response.json();
};

// Function to stream responses from OpenRouter
export const streamOpenRouter = async (
  apiKey: string = getApiKey(), 
  messages: { role: "system" | "user" | "assistant"; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[],
  model: ModelType = 'google/gemini-2.5-pro-exp-03-25:free',
  temperature: number = 0.7,
  maxTokens: number = 1024,
  onChunk: (chunk: string) => void
) => {
  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Lovable ChatRAG'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let responseContent = '';

  if (!reader) {
    throw new Error('Response body is null');
  }

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      break;
    }
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data:') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(5));
          const content = data.choices[0]?.delta?.content || '';
          if (content) {
            responseContent += content;
            onChunk(content);
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }
    }
  }

  return responseContent;
};
