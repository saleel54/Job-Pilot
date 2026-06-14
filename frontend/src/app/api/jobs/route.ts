import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'developer';
    const location = searchParams.get('location') || '';
    const page = searchParams.get('page') || '1';

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    // Return empty results if Adzuna keys are not present
    if (!appId || !appKey || appId.includes('mock') || appKey.includes('mock')) {
      return NextResponse.json({ results: [] });
    }

    // Call real Adzuna API
    // Adzuna URL for India: country code is 'in'
    // Treat 'india' as empty to search country-wide
    let locQuery = location.trim();
    if (locQuery.toLowerCase() === 'india') {
      locQuery = '';
    }

    const targetUrl = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=30&sort_by=date&what=${encodeURIComponent(
      query
    )}&where=${encodeURIComponent(locQuery)}`;

    const res = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Adzuna API returned status: ${res.status}`);
    }

    const data = await res.json();
    
    // Map Adzuna schema to local cleaner schema
    const results = data.results.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company?.display_name || 'Unknown Company',
      location: j.location?.display_name || 'India',
      description: j.description || '',
      source_url: j.redirect_url || '',
      source: 'adzuna',
      salary_min: j.salary_min || null,
      salary_max: j.salary_max || null,
      created: j.created || new Date().toISOString(),
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Adzuna job search error:', err);
    return NextResponse.json({
      results: [],
      error: err.message,
    });
  }
}
