'use client';
import { useState } from 'react';
import { Package } from 'lucide-react';
import { imageUrl } from '@/services/api.service';
import type { Report } from '@/lib/report-types';
export function ReportPhoto({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState('');
  if (!src || failed === src)
    return (
      <div
        className={`flex items-center justify-center bg-blue-50 text-slate-500 ${className}`}
      >
        <span className="flex items-center gap-2">
          <Package size={28} /> Image unavailable
        </span>
      </div>
    );
  // API images are already resized; avoid a separate image optimization service.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-cover ${className}`}
      onError={() => setFailed(src)}
    />
  );
}
export function ItemVisual({
  item,
  className = '',
}: {
  item: Report;
  className?: string;
  large?: boolean;
}) {
  return item.images[0] ? (
    <ReportPhoto
      src={imageUrl(item.images[0].url)}
      alt={item.title}
      className={`w-full ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-500 ${className}`}
    >
      <Package size={64} strokeWidth={1.3} />
      <span className="sr-only">No photo provided</span>
    </div>
  );
}
