import type { Metadata } from 'next';
import './globals.css';
import { publicMetadataCopy } from '@/content/love';
export const metadata: Metadata = { ...publicMetadataCopy, robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
