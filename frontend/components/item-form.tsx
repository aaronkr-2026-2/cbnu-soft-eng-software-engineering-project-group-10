'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Info, MapPin, Package, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';
import type { CampusItem, ItemDraft, ItemKind } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { useCampus } from '@/lib/store';

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const defaultDraft: ItemDraft = {
  kind: 'lost', title: '', category: 'Electronics', location: '', occurredAt: localToday(), description: '', image: ''
};

export function ItemForm({ initial, editId }: { initial?: CampusItem; editId?: string }) {
  const router = useRouter();
  const { addItem, editItem } = useCampus();
  const [draft, setDraft] = useState<ItemDraft>(() => initial ? {
    title: initial.title, kind: initial.kind, category: initial.category, location: initial.location,
    occurredAt: initial.occurredAt, description: initial.description, image: initial.image || ''
  } : defaultDraft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  function update<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) { setDraft((prev) => ({ ...prev, [key]: value })); }
  function readImage(file?: File) {
    setError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Please upload a JPG, PNG, or WebP image.'); return; }
    if (file.size > 1024 * 1024) { setError('For this browser-only demo, images must be under 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') update('image', reader.result); };
    reader.onerror = () => setError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!draft.title.trim() || !draft.location.trim() || !draft.description.trim() || !draft.occurredAt) { setError('Please complete all required fields.'); return; }
    if (draft.title.trim().length > 100) { setError('Item name must be under 100 characters.'); return; }
    if (draft.occurredAt > localToday()) { setError('Please choose today or an earlier date.'); return; }
    setSaving(true);
    try {
      const sanitized: ItemDraft = { ...draft, title: draft.title.trim(), description: draft.description.trim(), location: draft.location.trim() };
      if (editId) { editItem(editId, sanitized); router.push(`/items/${editId}?updated=1`); }
      else { const id = addItem(sanitized); router.push(`/items/${id}?created=1`); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="card-base space-y-8 p-6 sm:p-8">
        <div><h2 className="text-lg font-bold text-slate-900">1. What happened?</h2><p className="mt-1 text-sm text-slate-500">Let everyone know whether you lost or found this item.</p><div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="Report type">
          {(['lost', 'found'] as ItemKind[]).map((kind) => <button type="button" aria-pressed={draft.kind === kind} key={kind} onClick={() => update('kind', kind)} className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 text-center transition ${draft.kind === kind ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}><Package size={24}/><span className="text-sm font-bold">I {kind === 'lost' ? 'lost' : 'found'} an item</span></button>)}
        </div></div>
        <div className="h-px bg-slate-100"/>
        <div><h2 className="text-lg font-bold text-slate-900">2. Item details</h2><p className="mt-1 text-sm text-slate-500">A clear description helps others recognize it.</p>
          <div className="mt-5 space-y-5">
            <div><label className="label-base" htmlFor="item-title">Item name <span className="text-rose-500">*</span></label><input id="item-title" required maxLength={100} className="input-base" placeholder="e.g. AirPods Pro with blue case" value={draft.title} onChange={(e) => update('title', e.target.value)}/></div>
            <div><label className="label-base" htmlFor="item-category">Category <span className="text-rose-500">*</span></label><select id="item-category" className="input-base" value={draft.category} onChange={(e) => update('category', e.target.value as ItemDraft['category'])}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
            <div><label className="label-base" htmlFor="item-description">Description <span className="text-rose-500">*</span></label><textarea id="item-description" className="input-base min-h-[150px] resize-y" required maxLength={1000} value={draft.description} onChange={(e) => update('description', e.target.value)} placeholder="Color, brand, distinctive features, and where you last saw it..."/><p className="mt-2 text-right text-xs text-slate-400">{draft.description.length}/1000</p></div>
          </div>
        </div>
        <div className="h-px bg-slate-100"/>
        <div><h2 className="text-lg font-bold text-slate-900">3. Location & date</h2><p className="mt-1 text-sm text-slate-500">Help others narrow down their search.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><label className="label-base" htmlFor="item-location"><span className="inline-flex items-center gap-1"><MapPin size={15}/> Location *</span></label><input id="item-location" className="input-base" value={draft.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Central Library · 2F" required maxLength={140}/></div><div><label className="label-base" htmlFor="item-date"><span className="inline-flex items-center gap-1"><CalendarDays size={15}/> Date *</span></label><input type="date" id="item-date" className="input-base" max={localToday()} value={draft.occurredAt} onChange={(e) => update('occurredAt', e.target.value)} required/></div></div>
        </div>
        <div className="h-px bg-slate-100"/>
        <div><h2 className="text-lg font-bold text-slate-900">4. Add a photo <span className="text-sm font-normal text-slate-400">(optional)</span></h2><p className="mt-1 text-sm text-slate-500">An image makes your report easier to recognize.</p>
          {draft.image ? <div className="relative mt-5 h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.image} alt="Item upload preview" className="h-full w-full object-contain"/><button type="button" onClick={() => { update('image', ''); if (fileRef.current) fileRef.current.value = ''; }} className="absolute right-3 top-3 rounded-full bg-white p-2 text-slate-600 shadow-md" aria-label="Remove uploaded image"><X size={18}/></button>
          </div> : <button type="button" onClick={() => fileRef.current?.click()} className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-9 transition hover:border-blue-300 hover:bg-blue-50"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><UploadCloud size={25}/></span><span className="mt-3 text-sm font-bold text-slate-700">Click to upload an image</span><span className="mt-1 text-xs text-slate-400">PNG, JPG or WebP · Max 1 MB in demo mode</span></button>}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload item photo" onChange={(e) => readImage(e.target.files?.[0])}/>
          {draft.image && <button type="button" className="btn-quiet mt-2" onClick={() => fileRef.current?.click()}><Camera size={16}/> Change photo</button>}
        </div>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6"><Link href={editId ? `/items/${editId}` : '/items'} className="btn-secondary"><ArrowLeft size={16}/> Cancel</Link><button disabled={saving} type="submit" className="btn-primary">{saving ? 'Saving...' : editId ? 'Save changes' : 'Publish post'}<ArrowRight size={17}/></button></div>
      </div>
      <aside className="space-y-5 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600"><Info size={23}/></div><h3 className="mt-4 font-bold text-slate-900">Tips for a good post</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>• Use a clear, specific item title.</li><li>• Add identifiable colors or features.</li><li>• Be precise about the campus location.</li><li>• Keep private identifiers out of public descriptions.</li></ul></div>
        <div className="card-base p-6"><h3 className="font-bold">Safety first</h3><p className="mt-3 text-sm leading-7 text-slate-500">Don’t publish student ID numbers, passwords, or sensitive contents. Arrange returns at a public campus location and verify ownership.</p></div>
      </aside>
    </form>
  );
}
