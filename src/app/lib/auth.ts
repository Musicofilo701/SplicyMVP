
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface AuthenticatedRequest extends NextRequest {
  restaurant?: {
    id: string;
    name: string;
    email: string;
    api_key: string;
  };
}

export async function authenticateRequest(request: NextRequest) {
  // Check for API key in header
  const apiKey = request.headers.get("x-api-key");
  // Check for session token in header
  const sessionToken = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey && !sessionToken) {
    return { authenticated: false, error: "Missing authentication credentials" };
  }

  let restaurant = null;

  if (apiKey) {
    // Authenticate with API key
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, email, api_key")
      .eq("api_key", apiKey)
      .single();

    if (error || !data) {
      return { authenticated: false, error: "Invalid API key" };
    }
    restaurant = data;
  } else if (sessionToken) {
    // Authenticate with session token
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, email, api_key, session_expires")
      .eq("session_token", sessionToken)
      .single();

    if (error || !data) {
      return { authenticated: false, error: "Invalid session token" };
    }

    // Check if session is expired
    if (new Date(data.session_expires) < new Date()) {
      return { authenticated: false, error: "Session expired" };
    }

    restaurant = {
      id: data.id,
      name: data.name,
      email: data.email,
      api_key: data.api_key
    };
  }

  return { authenticated: true, restaurant };
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Add restaurant info to request
    (request as AuthenticatedRequest).restaurant = auth.restaurant;
    
    return handler(request as AuthenticatedRequest);
  };
}
