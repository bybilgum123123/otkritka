import { chromium } from '@playwright/test';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { unlockForQA } from './access-helper.mjs';

const check = (condition, message) => { if (!condition) throw new Error(message); };
const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
function hasGlyph(font, code) {
  const count = font.readUInt16BE(4);
  let cmap;
  for (let i = 0; i < count; i++) {
    const entry = 12 + i * 16;
    if (font.toString('ascii', entry, entry + 4) === 'cmap') cmap = font.readUInt32BE(entry + 8);
  }
  if (cmap === undefined) return false;
  for (let n = 0; n < font.readUInt16BE(cmap + 2); n++) {
    const table = cmap + font.readUInt32BE(cmap + 4 + n * 8 + 4);
    const format = font.readUInt16BE(table);
    if (format === 12) {
      for (let g = 0; g < font.readUInt32BE(table + 12); g++) {
        const group = table + 16 + g * 12;
        const start = font.readUInt32BE(group), end = font.readUInt32BE(group + 4);
        if (code >= start && code <= end && font.readUInt32BE(group + 8) + code - start > 0) return true;
      }
    }
    if (format === 4) {
      const segments = font.readUInt16BE(table + 6) / 2;
      for (let i = 0; i < segments; i++) {
        const end = font.readUInt16BE(table + 14 + i * 2);
        const start = font.readUInt16BE(table + 16 + segments * 2 + i * 2);
        if (code < start || code > end) continue;
        const delta = font.readInt16BE(table + 16 + segments * 4 + i * 2);
        const rangePosition = table + 16 + segments * 6 + i * 2;
        const range = font.readUInt16BE(rangePosition);
        let glyph = range ? font.readUInt16BE(rangePosition + range + (code - start) * 2) : code;
        if (range && glyph === 0) continue;
        glyph = (glyph + delta) & 65535;
        if (glyph > 0) return true;
      }
    }
  }
  return false;
}
for (const name of await readdir('public/fonts')) {
  if (!name.endsWith('.ttf')) continue;
  const font = await readFile('public/fonts/' + name);
  check([...letters].every(letter => hasGlyph(font, letter.codePointAt(0))), `Incomplete Cyrillic in ${name}`);
}
console.log('PASS all 66 Russian letters in every existing font file');

if (!process.env.LOVE_PASSWORD) {
  const local = await readFile('.env.local', 'utf8');
  process.env.LOVE_PASSWORD = local.match(/^LOVE_PASSWORD=(.*)$/m)?.[1]?.trim();
}
const base = process.env.BASE_URL || 'http://localhost:3002';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await mkdir('test-results/text-qa', { recursive: true });
const exact = async (selector, expected) => {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  check((await element.innerText()).trim() === expected, `Text differs in ${selector}`);
};
const phrases = ['твою улыбку', 'наши тупые приколы', 'когда ты рядом', 'как ты меня обнимаешь', 'короче… всю тебя, Масюня.'];
const captions = ['моя красавица', 'даже мороз не мешает', 'люблю эту фотку', 'тут мы миленькие', 'а тут ты особенно красивая', 'моя красавица'];
const body = 'Сегодня можно и без повода. Просто я подумал о тебе и захотел, чтобы ты улыбнулась. Мне так нравится, что именно ты у меня есть.';
const paragraphs = [
  'Я не всегда умею говорить всякие милые вещи вслух. Так что вот, сделал тебе целый сайт.',
  'Спасибо за наши разговоры, приколы и обнимашки. За то, что можно просто быть собой. И за обычные дни, которые с тобой совсем не обычные.',
  'Я иногда вредный. Иногда туплю. Но даже тогда я очень тебя люблю. И мне хочется, чтобы ты это всегда знала.',
];
try {
  for (const [width, height] of [[390,844], [1440,900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await unlockForQA(page);
    await exact('.intro-top > span', 'от твоего лапулика, с нежностью');
    await exact('.intro-note', 'у меня для тебя кое-что есть');
    await exact('.intro h1', 'Для моей\nЛапули');
    await exact('.intro-subtitle', 'Маленькая открытка. Большая любовь.');
    await exact('.open-button', 'открыть');
    await exact('.intro-bottom > span:first-child', 'сделано с любовью, только для тебя');
    await page.screenshot({ path: `test-results/text-qa/intro-${width}.png` });
    await page.getByRole('button', { name: 'открыть', exact: true }).click();
    await page.waitForTimeout(1500);
    await exact('.love-message h2', 'Я просто хотел\nнапомнить тебе\nодну вещь...');
    await exact('.love-message h3', 'я очень тебя люблю.');
    await exact('.love-message p', body);
    await exact('.scroll-note', 'и вот за что ↓');
    await page.locator('.love-message').screenshot({ path: `test-results/text-qa/message-${width}.png` });
    for (let i = 0; i < phrases.length; i++) {
      await page.locator('.things').evaluate((element, step) => {
        const start = element.getBoundingClientRect().top + scrollY;
        scrollTo({ top: start + (element.offsetHeight - innerHeight) * ((step + .3) / 5), behavior: 'instant' });
      }, i);
      await page.waitForTimeout(850);
      check(await page.locator('.phrase-stage h3').innerText() === phrases[i], `Animated phrase ${i}`);
      check(await page.locator('.phrase-dots span').count() === 5, 'Five indicators');
      await page.locator('.things-sticky').screenshot({ path: `test-results/text-qa/phrase-${width}-${i}.png` });
    }
    await exact('.things-sticky > p', 'Знаешь, что я в тебе люблю?');
    await exact('.things-sticky > .handwritten', 'люблю тебя всякую');
    await exact('.photo-heading h2', 'Наши маленькие\n«помнишь?»');
    await exact('.photo-heading p', width === 390 ? 'Некоторые моменты хочется положить в карман и всегда носить с собой.' : 'Некоторые моменты хочется положить в карман\nи всегда носить с собой.');
    await exact('.photo-heading > .handwritten', 'нажми на фото — побудем в этом моменте');
    for (let i = 0; i < captions.length; i++) {
      check(await page.locator(`.memory-${i} .handwritten`).innerText() === captions[i], `Caption ${i}`);
      await page.locator(`.memory-${i}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.locator(`.memory-${i}`).screenshot({ path: `test-results/text-qa/photo-${width}-${i}.png` });
    }
    await page.getByRole('button', { name: 'открыть письмо', exact: true }).last().click();
    await page.waitForTimeout(850);
    await exact('#personal-letter h3', 'Лапуля,');
    for (let i = 0; i < paragraphs.length; i++) check(await page.locator('#personal-letter p').nth(i).innerText() === paragraphs[i], `Letter paragraph ${i}`);
    await exact('#personal-letter .signature', 'Твой лапулик ♡');
    await page.locator('.letter-section').screenshot({ path: `test-results/text-qa/letter-${width}.png` });
    for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'нажми сюда, Писюня' }).click(); await page.waitForTimeout(500); }
    await page.locator('.surprise').screenshot({ path: `test-results/text-qa/surprise-${width}.png` });
    await exact('.final h2', 'Спасибо, что ты есть у меня.');
    await exact('.final p', 'люблю тебя, Лапуля.');
    await exact('.final .signature', '— твой лапулик');
    await page.locator('.final').screenshot({ path: `test-results/text-qa/final-${width}.png` });
    console.log(`PASS exact visible copy, all animated phrases and six captions at ${width}x${height}`);
  }
  check(errors.length === 0, 'Runtime errors during text QA');
} finally { await browser.close(); }
