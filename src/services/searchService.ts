
import { SearchResult } from "@/types";

// Brave Search API key
const BRAVE_API_KEY = "BSAXSH1kMKXa7RNrYhDx0ZwDGRi34wV";

// Función para buscar en internet a través de Brave Search
export const searchWithBrave = async (query: string): Promise<SearchResult[]> => {
  try {
    console.log(`Realizando búsqueda en Brave: ${query}`);
    
    const response = await fetch("https://api.search.brave.com/res/v1/web/search", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY
      },
      // Add query parameters to the URL
      // Web search requires the 'q' parameter at a minimum
      // https://api.search.brave.com/res/v1/web/search?q=brave+browser
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the Brave search results into our app's format
    return data.results?.map((result: any) => ({
      title: result.title || query,
      url: result.url || "",
      snippet: result.description || "No description available"
    })) || [];
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error);
    
    // Return a fallback result in case of error
    return [{
      title: `Search error for: ${query}`,
      url: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
      snippet: `There was an error performing the search. Please try again later.`
    }];
  }
};
