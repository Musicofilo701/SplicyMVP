import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table_id = searchParams.get("table_id");
  const restaurant_id = searchParams.get("restaurant_id");

  if (!table_id) {
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

  // Verify table exists and has an order
  const { data: orderExists, error: orderError } = await supabase
    .from("orders")
    .select("table_id, items")
    .eq("table_id", table_id)
    .single();

  if (orderError || !orderExists) {
    return NextResponse.json(
      {
        error: "No order found for this table. Please contact staff.",
      },
      { status: 404 },
    );
  }

  // Generate payment URL that customers will scan
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  const paymentUrl = `${baseUrl}/pay?table=${table_id}${restaurant_id ? `&restaurant=${restaurant_id}` : ""}`;

  // Calculate order total for QR metadata
  const orderTotal = orderExists.items.reduce(
    (sum: number, item: any) => sum + Number(item.price),
    0,
  );

  return NextResponse.json({
    table_id,
    payment_url: paymentUrl,
    qr_data: paymentUrl,
    order_total: orderTotal,
    items_count: orderExists.items.length,
    restaurant_id: restaurant_id || null,
    created_at: new Date().toISOString(),
  });
}

// POST endpoint to generate QR codes for new tables
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { table_id, restaurant_id } = body;

  if (!table_id) {
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

  // Check if table has an active order
  const { data: orderExists } = await supabase
    .from("orders")
    .select("table_id")
    .eq("table_id", table_id)
    .single();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  const paymentUrl = `${baseUrl}/pay?table=${table_id}${restaurant_id ? `&restaurant=${restaurant_id}` : ""}`;

  return NextResponse.json({
    table_id,
    payment_url: paymentUrl,
    qr_data: paymentUrl,
    has_active_order: !!orderExists,
    restaurant_id: restaurant_id || null,
    created_at: new Date().toISOString(),
  });
}
