import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Onest:wght@400;500;600&family=Marck+Script&display=swap';
let css = await (await fetch(url)).text();
await mkdir('public/fonts', { recursive: true });
for (const [i, match] of [...css.matchAll(/url\((https:[^)]+)\)/g)].entries()) {
 const name = `font-${i}.ttf`;
 await writeFile(`public/fonts/${name}`, Buffer.from(await (await fetch(match[1])).arrayBuffer()));
 css = css.replace(match[1], `/fonts/${name}`);
}
const path = 'src/app/globals.css';
await writeFile(path, `@import 'tailwindcss';\n@import './styles.css';\n${css}`);
console.log('Fonts saved locally.');
