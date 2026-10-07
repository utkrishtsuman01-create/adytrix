'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check, X, Truck, PackageCheck, BadgeCheck, RefreshCw, MapPin, Search, Send, Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inr } from '@/lib/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)
  const [history, setHistory] = useState([])
  const [busy, setBusy] = useState('')
  const [shiprocket, setShiprocket] = useState({ configured: false, loading: true, error: '' })
  const [packageDetails, setPackageDetails] = useState({ weight: 0.5, length: 20, width: 15, height: 10 })
  const [couriers, setCouriers] = useState([])
  const [selectedCourier, setSelectedCourier] = useState('')
  const [tracking, setTracking] = useState(null)

  const load = useCallback(() => {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => {
      setOrder(d.error ? null : d.order)
      setHistory(d.history || [])
      if (d.order?.shipmentPackage) setPackageDetails(d.order.shipmentPackage)
      if (d.order?.shiprocketTracking) setTracking(d.order.shiprocketTracking)
    })
  }, [id])

  const loadShiprocket = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shiprocket/status')
      const data = await res.json()
      setShiprocket({ ...data, loading: false })
      if (data.defaults && !order?.shipmentPackage) setPackageDetails(data.defaults)
    } catch {
      setShiprocket({ configured: false, loading: false, error: 'Could not check Shiprocket connection.' })
    }
  }, [order?.shipmentPackage])

  useEffect(() => { if (id) load() }, [id, load])
  useEffect(() => { if (id) loadShiprocket() }, [id, loadShiprocket])

  const updatePackage = (key) => (e) => setPackageDetails((p) => ({ ...p, [key]: e.target.value }))

  const api = async (url, options = {}, successMessage = '') => {
    setBusy(url)
    try {
      const res = await fetch(url, options)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      if (successMessage) toast.success(successMessage)
      return data
    } catch (err) {
      toast.error(err.message)
      return null
    } finally {
      setBusy('')
    }
  }

  const acceptAndCreate = async () => {
    const created = await api(`/api/admin/orders/${id}/shiprocket/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: packageDetails }),
    })
    if (!created) return
    await api(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    }, 'Order accepted and added to Shiprocket.')
    load()
  }

  const changeStatus = async (status) => {
    const data = await api(`/api/admin/orders/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    }, `Order marked ${status}`)
    if (data) load()
  }

  const markPaid = async () => {
    const data = await api(`/api/admin/orders/${id}/payment`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'paid' }),
    }, 'Payment marked as paid')
    if (data) load()
  }

  const getCouriers = async () => {
    const data = await api(`/api/admin/orders/${id}/shiprocket/couriers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: packageDetails }),
    }, 'Courier options loaded')
    if (!data) return
    const list = data.result?.data || data.result?.available_courier_companies || data.result?.couriers || []
    setCouriers(Array.isArray(list) ? list : [])
    if (list.length === 1) setSelectedCourier(String(list[0].courier_company_id || list[0].courier_id || ''))
  }

  const shipNow = async () => {
    if (!selectedCourier) { toast.error('Select a courier first.'); return }
    const data = await api(`/api/admin/orders/${id}/shiprocket/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierId: selectedCourier }),
    }, 'Courier assigned and AWB generated')
    if (data) { setCouriers([]); setSelectedCourier(''); load() }
  }

  const schedulePickup = async () => {
    const data = await api(`/api/admin/orders/${id}/shiprocket/pickup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    }, 'Pickup scheduled')
    if (data) load()
  }

  const track = async () => {
    const data = await api(`/api/admin/orders/${id}/shiprocket/track`)
    if (data) { setTracking(data.tracking); load() }
  }

  if (order === undefined) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#5f8aa1]" /></div>
  if (order === null) return <div className="py-20 text-center"><p>Order not found.</p><Button asChild className="mt-4"><Link href="/admin/orders">Back</Link></Button></div>

  const canCreateShipment = order.orderStatus === 'pending' || order.orderStatus === 'accepted'
  const actions = []
  if (order.orderStatus === 'pending') {
    actions.push({ label: 'Accept & Create Shiprocket Shipment', action: acceptAndCreate, icon: Send })
    actions.push({ label: 'Reject', action: () => changeStatus('rejected'), icon: X, danger: true })
  } else if (order.orderStatus === 'accepted') {
    actions.push({ label: 'Reject', action: () => changeStatus('rejected'), icon: X, danger: true })
  } else if (order.orderStatus === 'shipped') {
    actions.push({ label: 'Mark Completed', action: () => changeStatus('completed'), icon: PackageCheck })
  }

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-[#5f8aa1]">← Back to orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Order #{order.orderNumber}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_STYLES[order.orderStatus]}`}>{order.orderStatus}</span>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Items</h2>
            {order.items.map((it, i) => (
              <div key={i} className="flex gap-4 py-2">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#e7f0f4]">{it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}</div>
                <div className="flex-1"><p className="font-medium line-clamp-1">{it.name}</p><p className="text-sm text-muted-foreground">Qty {it.quantity} x {inr(it.price)}</p></div>
                <div className="font-semibold">{inr(it.price * it.quantity)}</div>
              </div>
            ))}
            <div className="mt-4 border-t border-border pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>- {inr(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? 'Free' : inr(order.shipping)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2"><span>Total</span><span>{inr(order.total)}</span></div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">Shiprocket</h2>
                <p className="text-sm text-muted-foreground">Create shipment, choose courier, assign AWB, schedule pickup and track.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${shiprocket.configured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {shiprocket.loading ? 'Checking…' : shiprocket.configured ? 'Connected' : 'Not configured'}
              </span>
            </div>

            {!shiprocket.configured && !shiprocket.loading && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Add <b>SHIPROCKET_EMAIL</b>, <b>SHIPROCKET_PASSWORD</b>, <b>SHIPROCKET_PICKUP_LOCATION</b> and <b>SHIPROCKET_ORIGIN_PINCODE</b> to Vercel environment variables.
              </div>
            )}

            {shiprocket.configured && (
              <>
                {canCreateShipment && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <div><Label>Weight (kg)</Label><Input className="mt-1.5" type="number" step="0.01" min="0.01" value={packageDetails.weight} onChange={updatePackage('weight')} /></div>
                    <div><Label>Length (cm)</Label><Input className="mt-1.5" type="number" step="0.1" min="1" value={packageDetails.length} onChange={updatePackage('length')} /></div>
                    <div><Label>Width (cm)</Label><Input className="mt-1.5" type="number" step="0.1" min="1" value={packageDetails.width} onChange={updatePackage('width')} /></div>
                    <div><Label>Height (cm)</Label><Input className="mt-1.5" type="number" step="0.1" min="1" value={packageDetails.height} onChange={updatePackage('height')} /></div>
                  </div>
                )}

                {order.shiprocketOrderId && (
                  <div className="mt-5 grid gap-3 rounded-lg bg-[#eaf3f7] p-4 text-sm sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Shiprocket Order:</span> <b>{order.shiprocketOrderId}</b></p>
                    <p><span className="text-muted-foreground">Shipment:</span> <b>{order.shiprocketShipmentId || '—'}</b></p>
                    <p><span className="text-muted-foreground">Courier:</span> <b>{order.shiprocketCourier || 'Not assigned'}</b></p>
                    <p><span className="text-muted-foreground">AWB:</span> <b>{order.shiprocketAwb || 'Not assigned'}</b></p>
                  </div>
                )}

                {order.shiprocketOrderId && !order.shiprocketAwb && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={getCouriers} disabled={!!busy}><Search className="mr-2 h-4 w-4" /> Get Courier Options</Button>
                  </div>
                )}

                {couriers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium">Available couriers</h3>
                    {couriers.map((c, idx) => {
                      const courierId = String(c.courier_company_id || c.courier_id || idx)
                      const selected = selectedCourier === courierId
                      return (
                        <button type="button" key={courierId} onClick={() => setSelectedCourier(courierId)} className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${selected ? 'border-[#5f8aa1] bg-[#eaf3f7]' : 'border-border hover:bg-muted'}`}>
                          <span className="font-medium">{c.courier_name || c.courier_company_name || 'Courier'}</span>
                          <span className="text-sm text-muted-foreground">{c.etd ? `ETA ${c.etd}` : ''} {c.freight_charge ? `· ₹${c.freight_charge}` : ''} {c.rating ? `· ★ ${c.rating}` : ''}</span>
                        </button>
                      )
                    })}
                    <Button onClick={shipNow} disabled={!!busy || !selectedCourier} className="w-full sm:w-auto"><Truck className="mr-2 h-4 w-4" /> Ship Now & Assign AWB</Button>
                  </div>
                )}

                {order.shiprocketAwb && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={schedulePickup} disabled={!!busy}><MapPin className="mr-2 h-4 w-4" /> Schedule Pickup</Button>
                    <Button variant="outline" onClick={track} disabled={!!busy}><RefreshCw className="mr-2 h-4 w-4" /> Track Shipment</Button>
                  </div>
                )}

                {tracking && (
                  <div className="mt-4 rounded-lg border border-border p-4 text-sm">
                    <p className="flex items-center gap-2 font-medium"><Clock3 className="h-4 w-4 text-[#5f8aa1]" /> {tracking.shipment_status || tracking.current_status || 'Tracking updated'}</p>
                    {tracking.etd && <p className="mt-1 text-muted-foreground">Estimated delivery: {tracking.etd}</p>}
                  </div>
                )}
              </>
            )}
          </section>

          {history.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-4">Status History</h2>
              <ul className="space-y-2 text-sm">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between"><span className="capitalize font-medium">{h.status}</span><span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString('en-IN')}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Actions</h2>
            <div className="space-y-2">
              {actions.length ? actions.map((a) => (
                <Button key={a.label} onClick={a.action} disabled={!!busy} variant={a.danger ? 'outline' : 'default'} className={`w-full justify-start ${a.danger ? 'text-destructive border-destructive/40 hover:bg-destructive hover:text-white' : ''}`}><a.icon className="mr-2 h-4 w-4" /> {a.label}</Button>
              )) : <p className="text-sm text-muted-foreground">No further status actions available.</p>}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm mb-2">Payment: <span className="font-medium capitalize">{order.paymentStatus}</span> ({order.paymentMethod === 'cod' ? 'COD' : 'Razorpay'})</p>
              {order.paymentStatus !== 'paid' && <Button onClick={markPaid} disabled={!!busy} variant="outline" className="w-full"><BadgeCheck className="mr-2 h-4 w-4" /> Mark as Paid</Button>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Customer</h2>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">{order.deliveryAddress.name}</p>
              <p>{order.deliveryAddress.phone}</p>
              <p>{order.deliveryAddress.email}</p>
              <p className="pt-2">{order.deliveryAddress.address}</p>
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
              <p>{order.deliveryAddress.country}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
