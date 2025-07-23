import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table_id, items, restaurant_id } = body

    // Validate required fields
    if (!table_id || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: table_id, items' },
        { status: 400 }
      )
    }

    // Validate items structure
    for (const item of items) {
      if (!item.id || !item.name || !item.price) {
        return NextResponse.json(
          { error: 'Each item must have id, name, and price' },
          { status: 400 }
        )
      }
    }

    // Check if order already exists for this table
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', table_id)
      .single()

    if (existingOrder) {
      // Update existing order
      const { data } = await supabase
        .from('orders')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('table_id', table_id)
        .select()

      if (!data) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Order updated',
        data: data[0]
      })
    } else {
      // Create new order
      const { data } = await supabase
        .from('orders')
        .insert([{ table_id, items, restaurant_id }])
        .select()

      if (!data) {
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Order created',
        data: data[0]
      })
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }
}