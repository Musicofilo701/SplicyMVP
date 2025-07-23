<<<<<<< HEAD

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Order, OrderItem } from "@/types/api";
=======
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e

const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
<<<<<<< HEAD
    const [{data: orders}, {data: payments}] = await Promise.all([
=======
    const [{data: orders, error: ordersError}, {data: payments, error: paymentsError }] = await Promise.all([
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
        supabase.from('orders').select('*'),
        supabase.from('payments').select('*')
    ])

<<<<<<< HEAD
    const tableStatus = (orders as Order[])?.map(order => {
        const orderTotal = order.items.reduce((sum: number, item: OrderItem) => sum + Number(item.price), 0)
=======
    const tableStatus = orders.map(order => {
        const orderTotal = order.items.reduce((sum: number, item: any) => sum + Number(item.price), 0)
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
        const paidAmounts = payments
        .filter(p => p.table_id === order.table_id)
        .map(p => Number(p.amount))
        const totalPaid = paidAmounts.reduce((a, b) => a + b, 0)

        let status = 'non pagato'
        if (totalPaid === 0) status = 'non pagato'
        else if (totalPaid < orderTotal) status = 'parziale'
        else status = 'pagato'

        return { table_id: order.table_id, orderTotal, totalPaid, status}
    })

    return NextResponse.json ({ orders, payments, tables: tableStatus})
<<<<<<< HEAD
}
=======
}
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
