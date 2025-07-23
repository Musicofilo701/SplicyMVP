<<<<<<< HEAD

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OrderItem } from "@/types/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
  const raw_id = request.nextUrl.searchParams.get("table_id");
  const table_id = raw_id ? raw_id.trim() : null;

  console.log("GET request received"); // Log when GET is called
  if (!table_id) {
    console.error("Missing table_id in GET"); // Log error for missing table_id
    return NextResponse.json({ error: "Missing table_id" }, { status: 400 });
  }

=======
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { table_id, amount, items, item_ids, customer_name } = body

  // Calcola quanto è stato già pagato per quel tavolo
const { data: previousPayments, error: payError } = await supabase
  .from('payments')
  .select('amount')
  .eq('table_id', table_id)

if (payError) {
  return NextResponse.json({ error: payError.message }, { status: 500 })
}

const totalPaid = previousPayments?.reduce(
  (sum, p) => sum + Number(p.amount), 0
)

// Recupera il totale ordine da "orders"
const { data: orderRow, error: orderError } = await supabase
  .from('orders')
  .select('items')
  .eq('table_id', table_id)
  .single()

if (orderError || !orderRow) {
  return NextResponse.json({ error: 'Order not found' }, { status: 404 })
}

const orderTotal = orderRow.items.reduce(
  (sum: number, item: any) => sum + Number(item.price), 0
)

if (totalPaid + amount > orderTotal) {
  return NextResponse.json(
    { error: 'Payment higher than order total' },
    { status: 400 }
  )
}


  if (!table_id || !amount || !items) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
  .from('payments')
  .insert([{ table_id, amount, items, item_ids, customer_name  }])
  .select() 

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const raw_id = request.nextUrl.searchParams.get("table_id")
  const table_id = raw_id ? raw_id.trim(): null
  console.log("table_id ricevuto", table_id)
  console.log( "URL supabase", process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!table_id) {
    return NextResponse.json({ error: 'Missing table_id' }, { status: 400 })
  }

  const {data: allPayments, error: errAll} = await supabase
  .from("payments")
  .select("*")

>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("table_id", table_id)
<<<<<<< HEAD
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Payments fetched successfully:", data);
  return NextResponse.json({ payments: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { table_id, amount, items, item_ids, customer_name } = body;

  console.log("POST request received with body:", body); // Log the POST request body

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
    previousPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0; // Ensure totalPaid is defined and falls back to 0 if there are no previous payments

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
    0,
  );

  if (totalPaid + amount > orderTotal) {
    return NextResponse.json(
      { error: "Payment higher than order total" },
      { status: 400 },
    );
  }

  if (!table_id || !amount || !items) {
    console.error("Missing fields in POST"); // Log error for missing fields
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("payments")
    .insert([{ table_id, amount, items, item_ids, customer_name }])
    .select();

  if (insertError) {
    console.error("Error inserting payment:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
=======
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payments: data })
}

>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
