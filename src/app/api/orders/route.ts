import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OrderItem } from "@/types/api";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const table_id = searchParams.get('table_id')

    if (!table_id) {
        return NextResponse.json({ error: 'Missing table_id'}, {status: 400})
    }

const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', table_id)
    .single()

if (error) {
    return NextResponse.json({ error: error.message}, { status: 500})
}

const orderTotal = data.items.reduce(
    (sum: number, item: OrderItem) => sum + Number(item.price),
    0
)

return NextResponse.json({ ...data, orderTotal})
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log("POST request received for orders:", data);
        
        // Add your order creation logic here
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Failed to parse JSON:", error);
        return NextResponse.json({ error: 'Invalid JSON', details: error.message }, { status: 400 });
    }
}