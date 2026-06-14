export async function fetchAI(url: string, options: RequestInit = {}): Promise<Response> {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '';
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'x-gemini-api-key': customKey,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}
