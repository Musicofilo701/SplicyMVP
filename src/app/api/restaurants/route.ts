
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, pos_system } = body

  if (!name || !email) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ 
      name, 
      email, 
      pos_system,
      api_key: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true,
    restaurant: data[0]
  })
}

export async function GET() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ restaurants: data })
}
