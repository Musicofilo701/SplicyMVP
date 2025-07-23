import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
  const { code } = request.nextUrl.searchParams;

  if (!code) {
    return NextResponse.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/callback`);
  }

  const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  }, {
    headers: {
      Accept: 'application/json',
    },
  });

  const accessToken = tokenResponse.data.access_token;

  const { user, session, error } = await supabase.auth.signIn({
    provider: 'github',
    access_token: accessToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ user, jwt: session?.access_token });
}