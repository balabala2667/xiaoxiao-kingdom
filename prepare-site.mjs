import { mkdir, copyFile } from 'node:fs/promises';
const assets = ['index.html', 'style.css', 'app.js', 'core.js', 'questions.js', 'renderer.js'];
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
for (const file of assets) {
  await copyFile(new URL(file, import.meta.url), new URL('./dist/' + file, import.meta.url));
}
console.log(`Prepared ${assets.length} static game assets.`);
