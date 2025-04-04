
import { OpenRouterRequest, OpenRouterResponse, ModelType } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouter(
  apiKey: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[],
  model: ModelType = 'google/gemini-2.5-pro-exp-03-25:free',
  temperature: number = 0.7,
  max_tokens: number = 1024
): Promise<OpenRouterResponse> {
  const request: OpenRouterRequest = {
    model,
    messages,
    temperature,
    max_tokens,
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

export async function streamOpenRouter(
  apiKey: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[],
  model: ModelType = 'google/gemini-2.5-pro-exp-03-25:free',
  temperature: number = 0.7,
  max_tokens: number = 1024,
  onChunk: (chunk: string) => void
): Promise<void> {
  const request: OpenRouterRequest = {
    model,
    messages,
    temperature,
    max_tokens,
    stream: true,
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk
        .split("\n")
        .filter((line) => line.trim() !== "" && line.trim() !== "data: [DONE]");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.substring(6));
            const content = json.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error("Error parsing SSE chunk", e);
          }
        }
      }
    }
  } catch (error) {
    console.error('OpenRouter streaming API call failed:', error);
    throw error;
  }
}

export function processImageForOpenRouter(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extract just the base64 data part (remove the data:image/jpeg;base64, part)
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
