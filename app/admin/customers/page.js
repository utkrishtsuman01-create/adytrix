'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState(null)
  useEffect(() => { fetch('/api/admin/customers').then((r) => r.json()).then((d) => setCustomers(d.customers || [])).catch(() => setCustomers([])) }, [])
  if (!customers) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Customers</h1>
      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">No customers yet.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Joined</th><th className="p-4">Orders</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4">{c.email}</td>
                  <td className="p-4">{c.phone}</td>
                  <td className="p-4">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-4">{c.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
