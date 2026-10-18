import {
  Backpack, BottleWine, CreditCard, Headphones, Laptop, Package, Plug, Umbrella,
  Wallet, type LucideIcon
} from 'lucide-react';
import type { CampusItem } from '@/lib/types';

export function ItemVisual({ item, large = false, className = '' }: { item: CampusItem; large?: boolean; className?: string }) {
  let Icon: LucideIcon = Package;
  let colors = 'from-blue-50 via-sky-100 to-indigo-100 text-blue-600';
  const lower = item.title.toLowerCase();
  if (lower.includes('airpods') || lower.includes('earphone')) Icon = Headphones;
  else if (lower.includes('card') || lower.includes('id')) Icon = CreditCard;
  else if (lower.includes('umbrella')) Icon = Umbrella;
  else if (lower.includes('charger')) Icon = Plug;
  else if (lower.includes('wallet')) Icon = Wallet;
  else if (lower.includes('bottle')) Icon = BottleWine;
  else if (lower.includes('laptop')) Icon = Laptop;
  else if (item.category === 'Bags') Icon = Backpack;
  if (item.category === 'Accessories') colors = 'from-amber-50 via-orange-100 to-rose-100 text-orange-600';
  if (item.category === 'ID & Cards') colors = 'from-purple-50 via-violet-100 to-fuchsia-100 text-violet-600';
  if (item.category === 'Other') colors = 'from-emerald-50 via-teal-100 to-cyan-100 text-emerald-600';
  if (item.category === 'Bags') colors = 'from-slate-100 via-blue-100 to-slate-200 text-slate-600';
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${colors} ${className}`}>
      {item.image ? (
        // User-selected local image, kept in browser storage in this UI demo.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[20px] border-white/35" />
          <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full border-[22px] border-white/25" />
          <div className={`relative flex items-center justify-center rounded-[28px] border border-white/80 bg-white/55 shadow-soft backdrop-blur-sm ${large ? 'h-36 w-36' : 'h-24 w-24'}`}>
            <Icon strokeWidth={1.45} size={large ? 72 : 48} />
          </div>
        </>
      )}
    </div>
  );
}
