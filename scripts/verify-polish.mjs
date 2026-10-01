import { chromium } from '@playwright/test';
import { access, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { unlockForQA } from './access-helper.mjs';

const base = process.env.BASE_URL || 'http://localhost:3002';
const browser = await chromium.launch({ headless: true });
const check = (condition, message) => { if (!condition) throw new Error(message); };
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [], warnings = [], assetFailures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});
page.on('response', response => { if (response.status() >= 400) assetFailures.push(response.url()); });

await page.goto(base);
await unlockForQA(page);
await page.getByRole('button', { name: 'открыть', exact: true }).click();
await page.waitForTimeout(1500);
for (const [width, height] of [[320,568],[360,800],[375,812],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]]) {
  await page.setViewportSize({ width, height });
  const clipped = await page.evaluate(() => {
    return [...document.querySelectorAll('h1, h2, h3, .love-message p, .photo-heading p')].filter(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1);
    }).map(element => element.textContent);
  });
  check(clipped.length === 0, `Clipped text ${width}: ${clipped}`);
}

await page.setViewportSize({ width: 390, height: 844 });
const phrases = ['твою улыбку', 'наши тупые приколы', 'когда ты рядом', 'как ты меня обнимаешь', 'короче… всю тебя, Масюня.'];
for (let i = 0; i < phrases.length; i++) {
  await page.locator('.things').evaluate((element, step) => {
    const start = element.getBoundingClientRect().top + scrollY;
    const travel = element.offsetHeight - innerHeight;
    scrollTo({ top: start + travel * ((step + .25) / 5), behavior: 'instant' });
  }, i);
  await page.waitForTimeout(600);
  check(await page.locator('.phrase-stage h3').innerText() === phrases[i], `Phrase ${i}`);
  check(await page.locator('.phrase-dots span').nth(i).getAttribute('class') === 'active', `Indicator ${i}`);
}
console.log('PASS all five scroll phrases and text bounds at thirteen sizes');

await page.getByRole('button', { name: 'открыть письмо', exact: true }).last().scrollIntoViewIfNeeded();
const before = await page.locator('.letter-reveal').evaluate(element => element.getBoundingClientRect().height);
await page.getByRole('button', { name: 'открыть письмо', exact: true }).last().click();
await page.waitForTimeout(100);
const middle = await page.locator('.letter-reveal').evaluate(element => element.getBoundingClientRect().height);
await page.waitForTimeout(800);
const after = await page.locator('.letter-reveal').evaluate(element => element.getBoundingClientRect().height);
check(before === 0 && middle > 0 && middle < after, 'Continuous letter expansion');
await page.getByRole('button', { name: 'сложить письмо', exact: true }).last().click();
console.log('PASS measured envelope animation');

const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const phone = await touch.newPage();
await phone.goto(base);
await unlockForQA(phone);
await phone.getByRole('button', { name: 'открыть', exact: true }).tap();
await phone.waitForTimeout(1500);
await phone.locator('.photo-album').scrollIntoViewIfNeeded();
const box = await phone.locator('.photo-album').boundingBox();
const session = await touch.newCDPSession(phone);
const y = Math.min(box.y + box.height / 2, 700);
await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y }] });
for (let x = 310; x >= 70; x -= 20) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  await phone.waitForTimeout(16);
}
await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await phone.waitForTimeout(700);
check(await phone.locator('.photo-album').evaluate(element => element.scrollLeft) > 150, 'Native gallery swipe');
await phone.locator('.memory').nth(1).tap();
await phone.getByRole('dialog').waitFor();
await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 310, y: 370 }] });
await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 130, y: 375 }] });
await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
check(await phone.locator('.lightbox-caption').innerText().then(text => text.includes('3 из 6')), 'Lightbox swipe');
await phone.getByRole('button', { name: 'Закрыть фотографию' }).tap();
await phone.close();
console.log('PASS native touch gallery and lightbox swipe');

// A short silent WAV fixture exercises playback; it is always removed afterward.
const musicPath = 'public/music.mp3';
let createdFixture = false;
let musicServer;
try {
  try { await access(musicPath); } catch {
    const samples = 22050;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(samples, 24); wav.writeUInt32LE(samples * 2, 28);
    wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
    await writeFile(musicPath, wav, { flag: 'wx' }); createdFixture = true;
  }
  musicServer = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3003'], { windowsHide: true, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { const response = await fetch('http://127.0.0.1:3003'); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  check(ready, 'Music fixture server');
  await page.goto('http://127.0.0.1:3003');
  await unlockForQA(page);
  check(await page.locator('audio').evaluate(element => element.paused), 'No automatic sound before interaction');
  await page.getByRole('button', { name: 'открыть', exact: true }).click();
  await page.getByRole('button', { name: 'Выключить музыку' }).waitFor();
  check(await page.locator('audio').evaluate(element => !element.paused), 'Playback after opening');
  await page.getByRole('button', { name: 'Выключить музыку' }).click();
  check(await page.locator('audio').evaluate(element => element.paused), 'Music pause');
  await page.reload();
  await page.getByRole('button', { name: 'открыть', exact: true }).click();
  await page.waitForTimeout(800);
  check(await page.locator('audio').evaluate(element => element.paused), 'Mute preference preserved');
  await page.getByRole('button', { name: 'Включить музыку' }).click();
  await page.getByRole('button', { name: 'Выключить музыку' }).waitFor();
  console.log('PASS music playback, pause and visit preference');
} finally {
  musicServer?.kill();
  if (createdFixture) await unlink(musicPath);
}

await page.goto(base);
await unlockForQA(page);
await page.evaluate(() => document.fonts.ready);
check(await page.evaluate(() => ['Onest', 'Cormorant Garamond', 'Marck Script'].every(family => [...document.fonts].some(font => font.family === family && font.status === 'loaded'))), 'Local font loading');
check(errors.length === 0 && warnings.length === 0 && assetFailures.length === 0, `Console/assets: ${JSON.stringify({ errors, warnings, assetFailures })}`);
console.log('PASS local fonts; zero console errors, warnings or failed assets');
await browser.close();
