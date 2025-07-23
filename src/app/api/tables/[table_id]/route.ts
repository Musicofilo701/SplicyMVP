<<<<<<< HEAD

=======
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
// app/api/tables/[table_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const table_id = request.nextUrl.pathname.split("/").pop()?.trim();
  if (!table_id) {
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

  // 1) Prendi l'ordine
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("items")
    .eq("table_id", table_id)
    .single();
  if (orderError || !orderRow) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
<<<<<<< HEAD
  const orderItems = orderRow.items as Array<{ id: string; price: string | number }>;
=======
  const orderItems = orderRow.items as any[];
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e

  // 2) Prendi i pagamenti
  const { data: payments, error: paymentError } = await supabase
    .from("payments")
    .select("amount, item_ids")
    .eq("table_id", table_id);
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  // 3) Calcoli
  const orderTotal = orderItems.reduce((sum, i) => sum + Number(i.price), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidIds = payments.flatMap(p => p.item_ids || []);
  const paidItems = orderItems.filter(i => paidIds.includes(i.id));
  const unpaidItems = orderItems.filter(i => !paidIds.includes(i.id));
  let status: string = "non pagato";
  if (totalPaid > 0 && totalPaid < orderTotal) status = "parziale";
  if (totalPaid >= orderTotal) status = "pagato";

  // 4) Risposta
  return NextResponse.json({
    table_id,
    orderTotal,
    totalPaid,
    status,
    paidItems,
    unpaidItems,
  });
}
