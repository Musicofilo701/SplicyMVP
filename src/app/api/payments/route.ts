import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OrderItem } from "@/types/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    console.log("Raw request text:", rawText);
    
    const body = JSON.parse(rawText);
    const { table_id, amount, items, item_ids, customer_name } = body;

    console.log("POST request received with body:", body);

  if (!table_id || !amount || !items) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Calculate already paid amount for that table
  const { data: previousPayments, error: payError } = await supabase
    .from("payments")
    .select("amount")
    .eq("table_id", table_id);

  if (payError) {
    console.error("Error fetching previous payments:", payError);
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  const totalPaid =
    previousPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("items")
    .eq("table_id", table_id)
    .single();

  if (orderError || !orderRow) {
    console.error("Order not found:", orderError);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderTotal = orderRow.items.reduce(
    (sum: number, item: OrderItem) => sum + Number(item.price),
    0
  );

  if (totalPaid + amount > orderTotal) {
    return NextResponse.json(
      { error: "Payment higher than order total" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([{ table_id, amount, items, item_ids, customer_name }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    return NextResponse.json({ 
      error: "Invalid JSON format in request body",
      details: parseError instanceof Error ? parseError.message : "Unknown parse error"
    }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const raw_id = request.nextUrl.searchParams.get("table_id");
  const table_id = raw_id ? raw_id.trim() : null;

  console.log("GET request received");
  if (!table_id) {
    console.error("Missing table_id in GET");
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("table_id", table_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Payments fetched successfully:", data);
  return NextResponse.json({ payments: data });
}