'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ShoppingCart, Clock, Check, Truck, PackageCheck, XCircle, Package, Users, IndianRupee } from 'lucide-react'
import { inr } from '@/lib/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data || !data.stats) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>
  const s = data.stats
  const cards = [
    { label: 'Total Orders', value: s.totalOrders, icon: ShoppingCart },
    { label: 'Pending', value: s.pending, icon: Clock },
    { label: 'Accepted', value: s.accepted, icon: Check },
    { label: 'Shipped', value: s.shipped, icon: Truck },
    { label: 'Completed', value: s.completed, icon: PackageCheck },
    { label: 'Rejected', value: s.rejected, icon: XCircle },
    { label: 'Products', value: s.totalProducts, icon: Package },
    { label: 'Customers', value: s.totalCustomers, icon: Users },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Overview of your store performance.</p>

      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-[#1b1613] to-[#2b241e] p-6 text-[#f4ead6] flex items-center justify-between">
        <div><p className="text-sm text-[#c9bca5]">Revenue (paid orders)</p><p className="mt-1 font-display text-3xl">{inr(s.revenue)}</p></div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B8862F]"><IndianRupee className="h-7 w-7" /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{c.label}</span><c.icon className="h-4 w-4 text-[#B8862F]" /></div>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="font-display text-xl">Recent Orders</h2><Link href="/admin/orders" className="text-sm text-[#B8862F] hover:underline">View all</Link></div>
        {data.recentOrders?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-4">Order</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Status</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4"><Link href={`/admin/orders/${o.id}`} className="text-[#8A6420] hover:underline">#{o.orderNumber}</Link></td>
                    <td className="py-2.5 pr-4">{o.customer}</td>
                    <td className="py-2.5 pr-4">{inr(o.total)}</td>
                    <td className="py-2.5 pr-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.orderStatus] || 'bg-muted'}`}>{o.orderStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted-foreground text-sm">No orders yet.</p>}
      </div>
    </div>
  )
}
