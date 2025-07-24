import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table_id = searchParams.get("table_id");

  if (!table_id) {
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

  // Recupera i pagamenti
  const { data: payments, error: paymentError } = await supabase
    .from("payments")
    .select("amount")
    .eq("table_id", table_id);

  if (paymentError) {
    console.error("payment error", paymentError);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Recupera l'ordine dal database
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
    (sum: number, item: { price: string | number }) => sum + Number(item.price),
    0
  );

  // Determina lo stato
  let status = "not paid";
  if (totalPaid === 0) status = "not paid";
  else if (totalPaid < orderTotal) status = "partial";
  else status = "paid";

  return NextResponse.json({ table_id, totalPaid, orderTotal, status });
}