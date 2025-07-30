import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table_id = searchParams.get('table_id');
  const restaurant_id = searchParams.get('restaurant_id');

  if (!table_id) {
    return NextResponse.json({ error: 'Missing table_id' }, { status: 400 });
  }

  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', table_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ 
        error: 'No active order found for this table',
        table_id,
        has_order: false
      }, { status: 404 });
    }

    // Get payment history
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('table_id', table_id)
      .order('created_at', { ascending: false });

    if (paymentError) {
      console.error('Error fetching payments:', paymentError);
    }

    // Calculate totals
    const orderTotal = order.items.reduce(
      (sum: number, item: any) => sum + Number(item.price),
      0
    );
    const totalPaid = (payments || []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // Determine status
    let status = 'unpaid';
    if (totalPaid === 0) status = 'unpaid';
    else if (totalPaid < orderTotal) status = 'partial';
    else status = 'paid';

    // Get paid item IDs
    const paidItemIds = (payments || []).flatMap(p => p.item_ids || []);
    const paidItems = order.items.filter((item: any) => paidItemIds.includes(item.id));
    const unpaidItems = order.items.filter((item: any) => !paidItemIds.includes(item.id));

    return NextResponse.json({
      table_id,
      has_order: true,
      items: order.items,
      orderTotal,
      totalPaid,
      status,
      payments: payments || [],
      restaurant_id: order.restaurant_id,
      created_at: order.created_at
    });

  } catch (error) {
    console.error('Error in table access:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      table_id,
      access_granted: false
    }, { status: 500 });
  }
}