
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const table_id = searchParams.get('table_id')
  const restaurant_id = searchParams.get('restaurant_id')

  if (!table_id) {
    return NextResponse.json({ error: 'Missing table_id' }, { status: 400 })
  }

  // Generate payment URL that customers will scan
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.replit.app'
  const paymentUrl = `${baseUrl}/pay?table=${table_id}${restaurant_id ? `&restaurant=${restaurant_id}` : ''}`

  return NextResponse.json({
    table_id,
    payment_url: paymentUrl,
    qr_data: paymentUrl
  })
}
