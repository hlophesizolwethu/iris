import type { ReactNode } from 'react'

type PhoneEvidence = {
  valid?: boolean
  lineType?: string
  carrier?: string
  mcc?: string | number
  mnc?: string | number
  international?: string
  national?: string
  country?: string
  countryCode?: string
  source?: string
}

function EvidenceItem({ label, value }: { label: string; value?: ReactNode }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-[var(--iris-navy)]">{value || 'Not returned'}</dd></div>
}

export default function PhoneEvidencePanel({ evidence }: { evidence: PhoneEvidence }) {
  return <section className="iris-panel mt-8 overflow-hidden"><div className="flex items-center gap-3 border-b border-[var(--iris-line)] bg-emerald-50 px-6 py-4"><span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">✓</span><div><h2 className="font-bold text-[var(--iris-navy)]">Phone intelligence</h2><p className="text-xs text-emerald-800">Verified provider response</p></div></div><div className="space-y-4 p-6"><div className="rounded-2xl border border-[var(--iris-line)] p-5"><h3 className="font-bold text-[var(--iris-navy)]">Information</h3><dl className="mt-5 grid gap-5 sm:grid-cols-2"><EvidenceItem label="Line type" value={evidence.lineType} /><EvidenceItem label="Carrier" value={evidence.carrier} /><EvidenceItem label="MCC" value={evidence.mcc} /><EvidenceItem label="MNC" value={evidence.mnc} /></dl></div><div className="rounded-2xl border border-[var(--iris-line)] p-5"><h3 className="font-bold text-[var(--iris-navy)]">Format</h3><dl className="mt-5 grid gap-5 sm:grid-cols-2"><EvidenceItem label="International" value={evidence.international} /><EvidenceItem label="National" value={evidence.national} /></dl></div><div className="rounded-2xl border border-[var(--iris-line)] p-5"><h3 className="font-bold text-[var(--iris-navy)]">Location</h3><dl className="mt-5 grid gap-5 sm:grid-cols-2"><EvidenceItem label="Country" value={evidence.country} /><EvidenceItem label="Country code" value={evidence.countryCode} /></dl></div>{evidence.source ? <a className="inline-block text-xs font-semibold text-blue-700 underline" href={evidence.source} target="_blank" rel="noreferrer">View provider source</a> : null}</div></section>
}
