import React, { useState } from 'react';

const dorkPayloads = [
  // Exposed repositories
  'site:github.com "{domain}"',
  'site:gitlab.com "{domain}"',
  'site:bitbucket.org "{domain}"',
  'site:pastebin.com "{domain}"',
  'site:trello.com "{domain}"',
  // Leaked sensitive files
  'site:{domain} ext:env | ext:git | ext:xml | ext:json | ext:conf | ext:log',
  'site:{domain} inurl:wp-content | inurl:wp-includes',
  'site:{domain} intitle:index.of',
  'site:{domain} filetype:sql',
  'site:{domain} filetype:xls | filetype:xlsx | filetype:csv',
  'site:{domain} password | credentials | secret',
  'site:{domain} "confidential" | "internal use only"',
  // Personal information
  'site:{domain} "ssn" | "social security number"',
  'site:{domain} "passport" | "driver license"',
  'site:{domain} "phone number" | "email address"',
  'site:{domain} "credit card" | "bank account"',
];


function buildGoogleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

async function fetchSerpApiResults(query: string, apiKey: string) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.organic_results || [];
  } catch {
    return [];
  }
}


const DorkSearch: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [useApi, setUseApi] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [results, setResults] = useState<{query: string, link: string, title: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setResults([]);
    setError('');
    if (!domain) return;
    if (useApi && apiKey) {
      setLoading(true);
      const found: {query: string, link: string, title: string}[] = [];
      for (const payload of dorkPayloads) {
        const query = payload.replace(/\{domain\}/g, domain);
        const serpResults = await fetchSerpApiResults(query, apiKey);
        if (serpResults.length > 0) {
          found.push({
            query,
            link: serpResults[0].link,
            title: serpResults[0].title || query,
          });
        }
      }
      setResults(found);
      setLoading(false);
      if (found.length === 0) setError('No exposed results found for this domain.');
    } else {
      setError('To see real exposed results, enable "Use API/Token" and provide a valid SerpAPI key.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Google Dork Search Tool</h1>
      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full"
          placeholder="Enter company domain (e.g. example.com)"
          value={domain}
          onChange={e => setDomain(e.target.value)}
        />
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="useApi"
          checked={useApi}
          onChange={e => setUseApi(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="useApi">Use API/Token (optional)</label>
        {useApi && (
          <input
            type="text"
            className="border p-2 ml-4 w-64"
            placeholder="Enter SerpAPI Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        )}
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
      <div className="mt-6">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {results.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold mb-2">Exposed Dork Search Links</h2>
            <ul className="list-disc pl-5 space-y-2">
              {results.map((item, idx) => (
                <li key={idx}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {item.query}
                  </a>
                  <div className="text-xs text-gray-500 ml-2">{item.title}</div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DorkSearch;
