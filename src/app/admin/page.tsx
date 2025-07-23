<<<<<<< HEAD

=======
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TableStatus = {
  table_id: string
  orderTotal: number
  totalPaid: number
  status: string
}

export default function AdminPage() {
  const [tables, setTables] = useState<TableStatus[]>([])

  const fetchTables = async () => {
    const res = await fetch('/api/tables')
    const data = await res.json()
    console.log('new data tables', data)
    setTables(data.tables)
  }

  useEffect(() => {
    fetchTables()

    const subscription = supabase
      .channel('payments-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
<<<<<<< HEAD
        () => {
=======
        (payload) => {
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
          fetchTables ()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  return (
  <div style={{ padding: '2rem' }}>
    <h1>Admin – Tavoli in tempo reale</h1>
    {tables.map((table) => (
      <div key={table.table_id} style={{ marginBottom: '1rem' }}>
        <strong>{table.table_id}</strong> – {table.status} – Totale ordine: €{table.orderTotal} – Pagato: €{table.totalPaid}
      </div>
    ))}
  </div>
)}
