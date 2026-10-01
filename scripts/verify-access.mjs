import { chromium } from '@playwright/test';
import { createHmac, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';

const password = randomBytes(24).toString('base64url');
const base = 'http://localhost:3004';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '0.0.0.0', '--port', '3004'], {
  env: { ...process.env, LOVE_PASSWORD: password }, windowsHide: true, stdio: 'ignore',
});
const check = (condition, message) => { if (!condition) throw new Error(message); };
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  check(ready, 'Test server ready');
  const privatePhrase = 'Спасибо за наши разговоры, приколы и обнимашки.';
  const publicResponse = await fetch(base);
  const html = await publicResponse.text();
  check(!html.includes(privatePhrase) && !html.includes('/photos/photo-1.jpg'), 'No private content in unauthenticated HTML');
  check(publicResponse.headers.get('cache-control').includes('no-store'), 'No page caching');
  const rsc = await fetch(base, { headers: { RSC: '1' } });
  check(!(await rsc.text()).includes(privatePhrase), 'No private content in unauthenticated RSC');
  for (const path of ['/photos/photo-1.jpg', '/%70hotos/photo-1.jpg', '/photos%2fphoto-1.jpg', '/music.mp3', '/_next/image?url=%2Fphotos%2Fphoto-1.jpg&w=640&q=75']) {
    check((await fetch(base + path)).status === 401, 'Private asset blocked');
  }
  for (const value of ['true', 'invalid', '9999999999.invalid.invalid']) {
    const response = await fetch(base, { headers: { cookie: 'love_access=' + value } });
    check(!(await response.text()).includes(privatePhrase), 'Forged cookie rejected');
  }
  const expiredPayload = `${Math.floor(Date.now() / 1000) - 10}.${randomBytes(16).toString('base64url')}`;
  const expiredSignature = createHmac('sha256', password).update(`love-access:v1:${expiredPayload}`).digest('base64url');
  const expired = await fetch(base, { headers: { cookie: `love_access=${expiredPayload}.${expiredSignature}` } });
  check(!(await expired.text()).includes(privatePhrase), 'Expired signed cookie rejected');
  const crossOrigin = await fetch(base + '/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example' }, body: JSON.stringify({ password }) });
  check(crossOrigin.status === 403 && !crossOrigin.headers.has('set-cookie'), 'Cross-origin submission rejected');
  for (const file of await readdir('.next/static', { recursive: true })) {
    if (file.endsWith('.js')) {
      const js = await readFile('.next/static/' + file, 'utf8');
      check(!js.includes(password) && !js.includes(privatePhrase), 'Password and private copy absent from public bundles');
    }
  }
  console.log('PASS server gate, RSC, private assets, encoded paths, forged/expired cookies, origin check and bundles');

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('401')) errors.push(message.text()); });
  await mkdir('test-results', { recursive: true });
  for (const [width, height] of [[320,568],[360,800],[375,812],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    check(await page.locator('.intro').count() === 0, 'Card absent before login');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Login responsive overflow');
    if ([320,390,1440].includes(width)) await page.screenshot({ path: `test-results/login-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Показать пароль' }).click();
  check(await page.locator('#love-password').getAttribute('type') === 'text', 'Password visibility');
  await page.getByRole('button', { name: 'Скрыть пароль' }).click();
  await page.locator('#love-password').fill('wrong-test-input');
  await page.getByRole('button', { name: 'открыть открытку' }).click();
  await page.getByRole('status').filter({ hasText: 'неа, попробуй ещё раз 🤭' }).waitFor();
  check(await page.locator('#love-password').evaluate(element => element === document.activeElement), 'Focus retained after error');
  check(!(await context.cookies()).some(cookie => cookie.name === 'love_access'), 'No cookie after wrong password');
  await page.locator('#love-password').fill(password);
  await page.getByRole('button', { name: 'открыть открытку' }).click();
  await page.getByRole('button', { name: 'открыть', exact: true }).waitFor();
  const cookie = (await context.cookies()).find(cookie => cookie.name === 'love_access');
  check(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Lax' && cookie.path === '/', 'Production cookie flags');
  check(cookie.expires > Date.now() / 1000 + 29 * 86400, 'Thirty-day cookie');
  check(await page.evaluate(() => !document.cookie.includes('love_access') && Object.keys(localStorage).every(key => !key.toLowerCase().includes('password'))), 'No browser-readable credentials');
  check((await context.request.get(base + '/photos/photo-1.jpg')).status() === 200, 'Authorized photo access');
  const photoResponse = await context.request.get(base + '/photos/photo-1.jpg');
  check(photoResponse.headers()['cache-control'].includes('no-store'), 'Private photo caching disabled');
  await page.reload();
  check(await page.locator('#love-password').count() === 0, 'Session survives reload');
  await page.getByRole('button', { name: 'открыть', exact: true }).click();
  await page.locator('.memory').first().click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'открыть письмо', exact: true }).last().click();
  await page.waitForTimeout(800);
  check(await page.locator('#personal-letter .signature').innerText() === 'Твой лапулик ♡', 'Original letter preserved');
  await page.getByRole('button', { name: 'начать сначала' }).click();
  check(await page.locator('#love-password').count() === 0, 'Restart preserves access');
  console.log('PASS login at 13 sizes; wrong password, visibility, success transition, cookie flags, reload and original card');
  await context.clearCookies();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base);
  await page.locator('#love-password').fill(password);
  await page.getByRole('button', { name: 'открыть открытку' }).click();
  await page.getByRole('button', { name: 'открыть', exact: true }).waitFor();
  check(errors.length === 0, 'No runtime or hydration errors');
  console.log('PASS reduced motion and clean runtime');
} finally {
  await browser?.close();
  server.kill();
}

