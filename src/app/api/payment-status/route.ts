<<<<<<< HEAD

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table_id = searchParams.get("table_id");

  if (!table_id) {
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
=======
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const table_id = searchParams.get('table_id')

  if (!table_id) {
    return NextResponse.json({ error: 'Missing table_id' }, { status: 400 })
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
  }

  // Recupera i pagamenti
  const { data: payments, error: paymentError } = await supabase
<<<<<<< HEAD
    .from("payments")
    .select("amount")
    .eq("table_id", table_id);

  if (paymentError) {
    console.error("payment error", paymentError);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Recupera l'ordine simulato
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3002}`;
  const orderRes = await fetch(`${baseUrl}/api/mock-pos`);
  
  if (!orderRes.ok) {
    console.error("Failed to fetch mock order:", orderRes.status);
    return NextResponse.json({ error: "Failed to fetch order data" }, { status: 500 });
  }
  
  const order = await orderRes.json();

  const orderTotal = order.items.reduce(
    (sum: number, item: { price: string | number }) => sum + Number(item.price),
    0,
  );
  console.log("Fetching payments for table_id:", table_id);
  console.log("Payments data:", payments);
  // Determina lo stato
  let status = "not paid";
  if (totalPaid === 0) status = "not paid";
  else if (totalPaid < orderTotal) status = "partial";
  else status = "paid";

  return NextResponse.json({ table_id, totalPaid, orderTotal, status });
=======
    .from('payments')
    .select('amount')
    .eq('table_id', table_id)

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 })
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Recupera l'ordine simulato
  const orderRes = await fetch('http://localhost:3000/api/mock-pos')
  const order = await orderRes.json()

  const orderTotal = order.items.reduce((sum: number, item: any) => sum + Number(item.price), 0)

  // Determina lo stato
  let status = 'non pagato'
  if (totalPaid === 0) status = 'non pagato'
  else if (totalPaid < orderTotal) status = 'parziale'
  else status = 'pagato'

  return NextResponse.json({ table_id, totalPaid, orderTotal, status })
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
}
