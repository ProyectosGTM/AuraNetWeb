/**
 * Descarga OpenAPI desde https://auran3t.mx/api/docs-json
 * Guarda docs/openapi-auranet.json y genera docs/swagger-analisis.md
 *
 * Uso: node scripts/generate-swagger-analisis.mjs
 * Opcional: node scripts/generate-swagger-analisis.mjs ruta/al/openapi.json
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'docs', 'openapi-auranet.json');
const OUT_MD = path.join(ROOT, 'docs', 'swagger-analisis.md');
const DOCS_URL = 'https://auran3t.mx/api/docs-json';

const MAX_DEPTH = 15;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

function resolveRef(spec, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur = spec;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  return cur;
}

function deepClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

function expandRefs(value, spec, depth, seenRefs) {
  if (depth > MAX_DEPTH) return { 'x-expand-truncated': true, 'x-max-depth': MAX_DEPTH };

  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => expandRefs(item, spec, depth, seenRefs));
  }

  if (typeof value.$ref === 'string') {
    const ref = value.$ref;
    if (seenRefs.has(ref)) {
      return { 'x-circular-ref': ref };
    }
    const target = resolveRef(spec, ref);
    if (target == null) {
      return { $ref: ref, 'x-unresolved': true };
    }
    seenRefs.add(ref);
    const expanded = expandRefs(deepClone(target), spec, depth + 1, seenRefs);
    seenRefs.delete(ref);
    const rest = { ...value };
    delete rest.$ref;
    const keys = Object.keys(rest);
    if (keys.length === 0) return expanded;
    if (typeof expanded === 'object' && expanded && !Array.isArray(expanded)) {
      return { ...expanded, ...rest };
    }
    return { allOf: [expanded, rest] };
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = expandRefs(v, spec, depth, seenRefs);
  }
  return out;
}

function expandSchemaOrMedia(schemaLike, spec) {
  if (schemaLike === undefined) return undefined;
  return expandRefs(schemaLike, spec, 0, new Set());
}

function formatJsonBlock(obj) {
  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```\n';
}

function collectOperations(spec) {
  const ops = [];
  const paths = spec.paths || {};
  for (const p of Object.keys(paths).sort()) {
    const item = paths[p];
    if (!item || typeof item !== 'object') continue;
    for (const method of Object.keys(item)) {
      const m = method.toLowerCase();
      if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(m)) {
        continue;
      }
      const op = item[method];
      if (!op || typeof op !== 'object') continue;
      const inherited = item.parameters || [];
      const own = op.parameters || [];
      ops.push({
        path: p,
        method: m,
        operation: op,
        parameters: [...inherited, ...own],
      });
    }
  }
  return ops;
}

function mdEscape(s) {
  if (s == null) return '';
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

async function main() {
  const argPath = process.argv[2];
  let raw;
  if (argPath) {
    raw = fs.readFileSync(path.resolve(argPath), 'utf8');
  } else if (fs.existsSync(OUT_JSON)) {
    raw = fs.readFileSync(OUT_JSON, 'utf8');
  } else {
    raw = await fetchText(DOCS_URL);
  }

  const spec = JSON.parse(raw);
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, raw, 'utf8');

  const openapiVer = spec.openapi || spec.swagger || '(sin openapi/swagger)';
  const info = spec.info || {};
  const servers = spec.servers || [];
  const pathKeys = Object.keys(spec.paths || {});
  const operations = collectOperations(spec);
  const securityDefs = spec.security || [];

  const lines = [];
  lines.push('# Análisis OpenAPI — AuraNet');
  lines.push('');
  lines.push(`- **Fuente (Swagger UI):** https://auran3t.mx/api/docs`);
  lines.push(`- **Fuente (JSON):** ${DOCS_URL}`);
  lines.push(`- **Copia local:** docs/openapi-auranet.json`);
  lines.push(`- **OpenAPI:** ${openapiVer}`);
  lines.push(`- **info.version:** ${info.version ?? '(sin version)'}`);
  lines.push(`- **info.title:** ${info.title ?? '(sin title)'}`);
  if (info.description) {
    lines.push('');
    lines.push('## info.description');
    lines.push('');
    lines.push(info.description);
  }
  lines.push('');
  lines.push('## servers');
  lines.push('');
  if (servers.length === 0) {
    lines.push('_(ninguno)_');
  } else {
    for (const s of servers) {
      const desc = s.description ? ` — ${s.description}` : '';
      lines.push(`- \`${s.url}\`${desc}`);
    }
  }
  lines.push('');
  lines.push(`- **Total paths (claves en \`paths\`):** ${pathKeys.length}`);
  lines.push(`- **Total operaciones (path × método):** ${operations.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const { path: p, method: m, operation: op, parameters: params } of operations) {
    lines.push(`## ${m.toUpperCase()} \`${p}\``);
    lines.push('');
    lines.push(`- **operationId:** ${op.operationId ?? '(sin operationId)'}`);
    lines.push(`- **tags:** ${(op.tags || []).join(', ') || '(sin tags)'}`);
    lines.push(`- **summary:** ${op.summary ?? '(sin summary)'}`);
    if (op.description) {
      lines.push('');
      lines.push('### description');
      lines.push('');
      lines.push(op.description);
    }
    lines.push('');

    const sec = op.security !== undefined ? op.security : securityDefs;
    lines.push('### security');
    lines.push('');
    if (sec && sec.length) {
      lines.push(formatJsonBlock(sec));
    } else {
      lines.push('_(ninguno)_');
      lines.push('');
    }

    lines.push('### parameters');
    lines.push('');
    if (!params.length) {
      lines.push('_(ninguno)_');
      lines.push('');
    } else {
      lines.push('| in | name | required | schema (expandido) | description |');
      lines.push('| --- | --- | --- | --- | --- |');
      for (const pr of params) {
        const baseSchema = pr.schema !== undefined ? pr.schema : pr;
        const expanded = expandSchemaOrMedia(baseSchema, spec);
        const schemaStr = mdEscape(JSON.stringify(expanded));
        lines.push(
          `| ${pr.in ?? ''} | ${mdEscape(pr.name)} | ${Boolean(pr.required)} | ${schemaStr} | ${mdEscape(pr.description)} |`
        );
      }
      lines.push('');
    }

    lines.push('### requestBody');
    lines.push('');
    const rb = op.requestBody;
    if (!rb) {
      lines.push('_(ninguno)_');
      lines.push('');
    } else {
      lines.push(`- **required:** ${Boolean(rb.required)}`);
      if (rb.description) lines.push(`- **description:** ${rb.description}`);
      lines.push('');
      const content = rb.content || {};
      for (const ct of Object.keys(content).sort()) {
        lines.push(`#### content-type: \`${ct}\``);
        lines.push('');
        const media = content[ct] || {};
        const schema = media.schema;
        if (schema === undefined) {
          lines.push('_(sin schema)_');
        } else {
          lines.push(formatJsonBlock(expandSchemaOrMedia(schema, spec)));
        }
        lines.push('');
      }
    }

    lines.push('### responses');
    lines.push('');
    const responses = op.responses || {};
    const codes = Object.keys(responses).sort();
    if (codes.length === 0) {
      lines.push('_(ninguno)_');
      lines.push('');
    } else {
      for (const code of codes) {
        const resp = responses[code] || {};
        lines.push(`#### \`${code}\``);
        lines.push('');
        if (resp.description) lines.push(resp.description);
        lines.push('');
        const content = resp.content || {};
        const cts = Object.keys(content);
        if (cts.length === 0) {
          lines.push('_(sin content / solo descripción)_');
          lines.push('');
          if (resp.headers && Object.keys(resp.headers).length) {
            lines.push('**headers:**');
            lines.push('');
            lines.push(formatJsonBlock(expandSchemaOrMedia(resp.headers, spec)));
          }
          continue;
        }
        for (const ct of cts.sort()) {
          lines.push(`##### content-type: \`${ct}\``);
          lines.push('');
          const media = content[ct] || {};
          const schema = media.schema;
          if (schema === undefined) {
            lines.push('_(sin schema)_');
          } else {
            lines.push(formatJsonBlock(expandSchemaOrMedia(schema, spec)));
          }
          lines.push('');
        }
        if (resp.headers && Object.keys(resp.headers).length) {
          lines.push('**headers:**');
          lines.push('');
          lines.push(formatJsonBlock(expandSchemaOrMedia(resp.headers, spec)));
        }
      }
    }

    lines.push('---');
    lines.push('');
  }

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
  const stat = fs.statSync(OUT_MD);
  const pathIndex = path.join(ROOT, 'docs', 'swagger-path-index.txt');
  fs.writeFileSync(pathIndex, pathKeys.sort().join('\n') + '\n', 'utf8');
  console.log(
    JSON.stringify(
      {
        openapi: openapiVer,
        infoVersion: info.version,
        paths: pathKeys.length,
        operations: operations.length,
        outJson: OUT_JSON,
        outMd: OUT_MD,
        pathIndex,
        bytesMd: stat.size,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
