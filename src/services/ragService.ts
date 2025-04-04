
import { RAGChunk, RAGSource } from "../types";

// In a real application, this would use actual NLP techniques
// This is a simplified mock implementation
export async function processDocument(document: File | string): Promise<RAGSource> {
  // For demo purposes, we'll just create a simple RAG source with mock chunks
  const id = `doc-${Date.now()}`;
  const isFile = document instanceof File;
  
  let content = '';
  let name = '';
  
  if (isFile) {
    content = await readFileContent(document);
    name = document.name;
  } else {
    // Assume it's a URL or text
    const isUrl = document.startsWith('http');
    name = isUrl ? new URL(document).hostname : 'Texto personalizado';
    content = document; // In a real app, you'd fetch the URL content
  }
  
  // Create mock chunks - in a real app, this would use proper text splitting
  const chunks = splitIntoChunks(content);
  
  return {
    id,
    name,
    type: isFile ? 'document' : (content.startsWith('http') ? 'url' : 'text'),
    content,
    chunks,
  };
}

// Helper function to read file content
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      // For non-text files, we'd need more sophisticated processing
      // For this demo, we'll just return the file name
      resolve(`[Contenido binario de ${file.name}]`);
    }
  });
}

// Simple text chunking - in a real app, you'd use more sophisticated methods
function splitIntoChunks(text: string): RAGChunk[] {
  // Simple method: split by paragraph or every ~500 chars
  const roughChunks = text.split(/\n\s*\n/);
  
  const chunks: RAGChunk[] = [];
  let currentChunk = '';
  
  roughChunks.forEach((chunk) => {
    if ((currentChunk + chunk).length < 500) {
      currentChunk += (currentChunk ? '\n\n' : '') + chunk;
    } else {
      if (currentChunk) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk,
          metadata: { position: chunks.length }
        });
      }
      currentChunk = chunk;
    }
  });
  
  // Add the last chunk if there is one
  if (currentChunk) {
    chunks.push({
      id: `chunk-${chunks.length}`,
      content: currentChunk,
      metadata: { position: chunks.length }
    });
  }
  
  return chunks;
}

// Find relevant chunks for a query - in a real app, you'd use embeddings and similarity search
export function findRelevantChunks(sources: RAGSource[], query: string): RAGChunk[] {
  // Simple keyword-based relevance (very naive)
  const keywords = query.toLowerCase().split(/\s+/);
  
  const allChunks = sources.flatMap(source => source.chunks || []);
  
  return allChunks
    .map(chunk => {
      const content = chunk.content.toLowerCase();
      // Calculate a naive relevance score
      const score = keywords.reduce((acc, keyword) => {
        return acc + (content.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;
      
      return { chunk, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 most relevant chunks
    .map(item => item.chunk);
}

// Generate context for the RAG system
export function generateRAGContext(chunks: RAGChunk[]): string {
  if (chunks.length === 0) return '';
  
  return `
Información relevante del contexto:

${chunks.map((chunk, index) => `[Fragmento ${index + 1}]:\n${chunk.content}`).join('\n\n')}

Usa esta información para responder a la pregunta del usuario.
`;
}
