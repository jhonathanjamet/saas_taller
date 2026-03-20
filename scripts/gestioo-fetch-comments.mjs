import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { chromium } from 'playwright';

const baseUrl = process.env.GESTIOO_BASE_URL || 'https://taller.gestioo.net';
const listUrl = process.env.GESTIOO_ORDERS_URL || `${baseUrl}/taller/ordenes/lista`;
const notesUrlBase =
  process.env.GESTIOO_NOTES_URL || `${baseUrl}/taller/ordenes/obtener_orden/{id}`;
const referer = process.env.GESTIOO_REFERER || `${baseUrl}/taller/ordenes/sucursal/3123`;
const outputPath =
  process.env.GESTIOO_COMMENTS_OUTPUT || path.resolve(process.cwd(), 'gestioo_comentarios.json');
const loginUrl = process.env.GESTIOO_LOGIN_URL || `${baseUrl}/login`;
const listPayload =
  process.env.GESTIOO_LIST_PAYLOAD ||
  new URLSearchParams({
    draw: '1',
    start: '0',
    length: '500',
  }).toString();
const limit = process.env.GESTIOO_LIMIT ? Number(process.env.GESTIOO_LIMIT) : null;

function prompt(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

function buildHeaders() {
  return {
    accept: 'application/json, text/javascript, */*; q=0.01',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'x-requested-with': 'XMLHttpRequest',
    origin: baseUrl,
    referer,
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  };
}

async function fetchJson(page, url, bodyString = '') {
  const result = await page.evaluate(
    async ({ url, headers, bodyString }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyString,
        credentials: 'include',
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    },
    { url, headers: buildHeaders(), bodyString },
  );

  if (!result.ok) {
    throw new Error(`HTTP ${result.status} en ${url}`);
  }
  if ((result.text || '').trim().startsWith('<')) {
    throw new Error(`HTML recibido en ${url}. Cloudflare bloqueó la petición.`);
  }
  return JSON.parse(result.text || '{}');
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Abriendo Gestioo. Inicia sesión en la ventana que se abrió.');
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await prompt('Cuando estés logueado en el panel, vuelve aquí y presiona ENTER...');

  console.log('Obteniendo listado de órdenes...');
  const listJson = await fetchJson(page, listUrl, listPayload);
  const orders = listJson.data || [];

  if (!orders.length) {
    console.log('No se encontraron órdenes.');
    await browser.close();
    process.exit(0);
  }

  const sliced = limit ? orders.slice(0, limit) : orders;
  const results = [];

  for (let i = 0; i < sliced.length; i += 1) {
    const order = sliced[i];
    const url = notesUrlBase.includes('{id}')
      ? notesUrlBase.replace(/\{id\}/g, String(order.id))
      : notesUrlBase;
    try {
      const json = await fetchJson(page, url, '');
      results.push(json);
      if ((i + 1) % 10 === 0) {
        console.log(`Avance: ${i + 1}/${sliced.length}`);
      }
    } catch (err) {
      console.log(`Error en orden ${order.id}: ${err.message}`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Archivo generado: ${outputPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error('Error general:', err);
  process.exit(1);
});
