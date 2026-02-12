const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region } = await req.json();

    const baseRegion = region || 'Ukraine';
    const searchQuery = query
      ? `${query} military drone ${baseRegion}`
      : `drone strike attack ${baseRegion}`;

    // Use Google News RSS — free, no API key required
    const encoded = encodeURIComponent(searchQuery);
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `RSS fetch failed: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xml = await response.text();
    const reports = parseRssItems(xml);

    return new Response(
      JSON.stringify({ success: true, data: reports }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface OsintReport {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  fetched_at: number;
}

function parseRssItems(xml: string): OsintReport[] {
  const items: OsintReport[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let i = 0;

  while ((match = itemRegex.exec(xml)) !== null && i < 10) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const source = extractTag(block, 'source');
    const pubDate = extractTag(block, 'pubDate');

    items.push({
      id: `osint_${Date.now()}_${i}`,
      title: decodeHtml(title || 'Unknown Report'),
      url: link || '',
      summary: decodeHtml(stripHtml(description || '')).slice(0, 300),
      source: source || extractDomain(link || ''),
      fetched_at: pubDate ? new Date(pubDate).getTime() : Date.now(),
    });
    i++;
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
  return m ? m[1].trim() : '';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}
