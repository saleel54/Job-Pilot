import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if profile exists for redirect
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to auth page with an error
  return NextResponse.redirect(`${origin}/auth?error=Authentication failed`);
}
