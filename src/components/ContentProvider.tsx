'use client';
import { createContext, useContext } from 'react';
import type { loveContent } from '@/content/love';

type LoveContent = typeof loveContent;
const ContentContext = createContext<LoveContent | null>(null);

export function ContentProvider({ content, children }: { content: LoveContent; children: React.ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useLoveContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error('Content provider is missing');
  return content;
}
