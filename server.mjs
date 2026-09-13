import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep) || !['.html', '.css', '.js', '.svg'].includes(extname(file))) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', types[extname(file)]);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT) || 4173, '0.0.0.0', () => console.log('小小战大军：http://localhost:' + (process.env.PORT || 4173)));
