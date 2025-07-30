import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, pos_system } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert([
        {
          name,
          email,
          password, // Ensure you hash the password before storing it for secure storage.
          pos_system,
          api_key: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting restaurant:", error.message); // Log the error
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      restaurant: data[0],
    });
  } catch (err) {
    console.error("Server error:", err); // Log unexpected errors
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
