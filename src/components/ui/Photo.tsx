'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useLoveContent } from '@/components/ContentProvider';
export default function Photo({ index, priority = false, full = false }: { index: number; priority?: boolean; full?: boolean }) {
 const c = useLoveContent();
 const [failed, setFailed] = useState(false); const photo = c.photos[index];
 return failed ? <div className="photo-missing"><span>♡</span>{c.ui.missingPhoto}</div> : <Image src={photo.src} alt={photo.alt} fill unoptimized sizes={full ? '100vw' : '(max-width: 600px) 78vw, 430px'} preload={priority} onError={() => setFailed(true)} style={{ objectFit: full ? 'contain' : 'cover' }} />;
}

