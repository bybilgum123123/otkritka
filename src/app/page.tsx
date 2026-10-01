import Keepsake from '@/components/Keepsake';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, hasAccess } from '@/lib/access';
import { loveContent, gateContent } from '@/content/love';
import { ContentProvider } from '@/components/ContentProvider';
import PasswordGate from '@/components/PasswordGate';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const cookieStore = await cookies();
  if (!hasAccess(cookieStore.get(ACCESS_COOKIE)?.value)) return <PasswordGate content={gateContent} />;
  return <ContentProvider content={loveContent}><Keepsake hasMusic={existsSync(join(process.cwd(), 'public', 'music.mp3'))} /></ContentProvider>;
}
