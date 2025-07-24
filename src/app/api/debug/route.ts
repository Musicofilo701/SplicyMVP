import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Order, OrderItem, Payment } from "@/types/api";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const [{ data: orders }, { data: payments }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('payments').select('*')
    ]);

    const tableStatus = (orders as Order[])?.map(order => {
        const orderTotal = order.items.reduce((sum: number, item: OrderItem) => sum + Number(item.price), 0);
        const paidAmounts = payments
            ?.filter(p => p.table_id === order.table_id)
            .map(p => Number(p.amount)) || [];
        const totalPaid = paidAmounts.reduce((a, b) => a + b, 0);

        let status = 'non pagato';
        if (totalPaid === 0) status = 'non pagato';
        else if (totalPaid < orderTotal) status = 'parziale';
        else status = 'pagato';

        return { table_id: order.table_id, orderTotal, totalPaid, status };
    }) || [];

    return NextResponse.json({ orders, payments, tables: tableStatus });
}