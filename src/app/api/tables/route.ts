// pages/api/tables.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Order, OrderItem, Payment } from "@/types/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const [{ data: orders }, { data: payments }] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("payments").select("*"),
  ]);

  if (!orders || !payments) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  const response = (orders as Order[]).map((order) => {
    const orderTotal = order.items.reduce(
      (sum: number, item: OrderItem) => sum + Number(item.price),
      0,
    );
    const paidAmounts = (payments as Payment[])
      .filter((p) => p.table_id === order.table_id)
      .map((p) => Number(p.amount));
    const totalPaid = paidAmounts.reduce((a, b) => a + b, 0);

    const paidIds = (payments as Payment[])
      .filter((p) => p.table_id === order.table_id)
      .flatMap((p) => p.item_ids || []);
    const paidItems = order.items.filter((i) => paidIds.includes(i.id));
    const unpaidItems = order.items.filter((i) => !paidIds.includes(i.id));

    let status = "non pagato";
    if (totalPaid === 0) status = "non pagato";
    else if (totalPaid < orderTotal) status = "parziale";
    else status = "pagato";

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