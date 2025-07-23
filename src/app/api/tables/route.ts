<<<<<<< HEAD

// pages/api/tables.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Order, OrderItem, Payment } from "@/types/api";
=======
// pages/api/tables.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

<<<<<<< HEAD
export async function GET() {
=======
export async function GET(_request: NextRequest) {
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
  // 1) prendi tutti gli ordini
  const { data: orders, error: orderError } = await supabase
    .from("orders")
    .select("table_id, items");

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // 2) prendi tutti i pagamenti con i nuovi campi
  const { data: payments, error: paymentError } = await supabase
    .from("payments")
    .select("table_id, amount, item_ids, customer_name");

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  // 3) ricava lo stato e quali item sono già stati pagati
<<<<<<< HEAD
  const response = (orders as Order[])?.map((order) => {
    // totale dell'ordine
    const orderTotal = order.items.reduce(
      (sum: number, item: OrderItem) => sum + Number(item.price),
=======
  const response = orders.map((order) => {
    // totale dell'ordine
    const orderTotal = order.items.reduce(
      (sum: number, item: any) => sum + Number(item.price),
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
      0
    );

    // somma di tutti gli amount
<<<<<<< HEAD
    const totalPaid = (payments as Payment[])
      ?.filter((p) => p.table_id === order.table_id)
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // raccogli tutti gli item_ids pagati
    const paidItemIds = (payments as Payment[])
      ?.filter((p) => p.table_id === order.table_id)
      .flatMap((p) => p.item_ids ?? []) || [];

    // lista di oggetti pagati
    const paidItems = order.items.filter((item: OrderItem) =>
=======
    const totalPaid = payments
      .filter((p) => p.table_id === order.table_id)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // raccogli tutti gli item_ids pagati
    const paidItemIds = payments
      .filter((p) => p.table_id === order.table_id)
      .flatMap((p) => p.item_ids ?? []);

    // lista di oggetti pagati
    const paidItems = order.items.filter((item: any) =>
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
      paidItemIds.includes(item.id)
    );

    // lista di oggetti ancora aperti
    const unpaidItems = order.items.filter(
<<<<<<< HEAD
      (item: OrderItem) => !paidItemIds.includes(item.id)
=======
      (item: any) => !paidItemIds.includes(item.id)
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
    );

    // determina lo stato
    let status: "non pagato" | "parziale" | "pagato" = "non pagato";
    if (totalPaid > 0 && totalPaid < orderTotal) status = "parziale";
    else if (totalPaid >= orderTotal) status = "pagato";

    return {
      table_id: order.table_id,
      orderTotal,
      totalPaid,
      status,
      paidItems,
      unpaidItems,
    };
  });

  return NextResponse.json({ tables: response });
}
