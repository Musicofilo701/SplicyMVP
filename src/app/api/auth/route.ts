
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Restaurant Registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, pos_system } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    // Check if restaurant already exists
    const { data: existing } = await supabase
      .from("restaurants")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Restaurant with this email already exists" },
        { status: 409 }
      );
    }

    // Generate API key and session token
    const api_key = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session_token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

    // Create restaurant
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert([{
        name,
        email,
        password_hash: password, // In production, hash this!
        pos_system,
        api_key,
        session_token,
        session_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }])
      .select("id, name, email, api_key, session_token")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Restaurant registered successfully",
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        api_key: restaurant.api_key
      },
      session_token: restaurant.session_token
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Restaurant Login
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  // Find restaurant
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("email", email)
    .eq("password_hash", password) // In production, compare hashed passwords!
    .single();

  if (error || !restaurant) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Generate new session token
  const session_token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  const session_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Update session
  await supabase
    .from("restaurants")
    .update({ session_token, session_expires })
    .eq("id", restaurant.id);

  return NextResponse.json({
    success: true,
    message: "Login successful",
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      email: restaurant.email,
      api_key: restaurant.api_key
    },
    session_token
  });
}
