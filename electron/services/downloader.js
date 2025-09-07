import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import https from 'node:https';

const streamPipeline = promisify(pipeline);

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const read = fs.createReadStream(filePath);
    read.on('error', reject);
    read.on('end', () => resolve(hash.digest('hex')));
    read.on('data', (chunk) => hash.update(chunk));
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      })
      .on('error', reject);
  });
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function createCancelToken() {
  return { cancelled: false, requests: new Set() };
}

export function cancelToken(token) {
  if (!token) return;
  token.cancelled = true;
  for (const req of token.requests) { try { req.destroy(new Error('cancelled')); } catch {} }
  token.requests.clear();
}

const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNABORTED', 'ENETRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE',
]);

async function downloadToFile(url, dest, onProgress, attempt = 1, token) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    if (token?.cancelled) { file.close(() => {}); return reject(new Error('cancelled')); }
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close(() => {});
        fs.unlink(dest, () => {});
        if (res.statusCode && [429,500,502,503,504].includes(res.statusCode) && attempt < 5) {
          const backoff = Math.min(2000 * attempt, 10000);
          res.resume();
          return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token)));
        }
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const total = Number(res.headers['content-length'] || 0);
      let received = 0;
      res.on('data', (chunk) => { received += chunk.length; if (total && onProgress) onProgress(received, total); });
      res.on('aborted', () => {
        file.close(() => {});
        fs.unlink(dest, () => {});
        if (attempt < 5) {
          const backoff = Math.min(2000 * attempt, 10000);
          return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token)));
        }
        reject(new Error('response aborted'));
      });
      streamPipeline(res, file).then(() => resolve()).catch(reject);
    });
    token?.requests.add(req);
    req.on('close', () => token?.requests.delete(req));
    req.setTimeout(45000, () => { try { const err = new Error('Request timeout'); err.code = 'ETIMEDOUT'; req.destroy(err); } catch {} });
    if (token?.cancelled) { try { req.destroy(new Error('cancelled')); } catch {} }
    req.on('error', (err) => {
      const code = err?.code;
      const canRetry = attempt < 5 && (code && RETRYABLE_ERROR_CODES.has(String(code)));
      fs.unlink(dest, () => {
        if (canRetry) {
          const backoff = Math.min(2000 * attempt, 10000);
          return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token)));
        }
        reject(err);
      });
    });
  });
}

async function fileExistsAndValid(filePath, expectedChecksum, expectedSize) {
  try {
    const stat = fs.statSync(filePath);
    if (expectedSize && Number(expectedSize) > 0 && stat.size !== Number(expectedSize)) {
      return false;
    }
    const hash = await sha256File(filePath);
    return hash.toLowerCase() === String(expectedChecksum).toLowerCase();
  } catch {
    return false;
  }
}

export async function fetchChecksums(gameBaseUrl) {
  const url = `${gameBaseUrl.replace(/\/$/, '')}/checksums.json`;
  return fetchJson(url);
}

export async function downloadFileObject(baseUrl, fileObj, installDir, emit, partConcurrency = 4, token) {
  const targetPath = path.join(installDir, fileObj.path.replace(/\\/g, path.sep));
  ensureDir(path.dirname(targetPath));

  // Skip download if file already matches checksum
  if (await fileExistsAndValid(targetPath, fileObj.checksum, fileObj.size)) {
    emit('progress:skip', { path: fileObj.path });
    return;
  }

  if (token?.cancelled) throw new Error('cancelled');

  if (Array.isArray(fileObj.parts) && fileObj.parts.length > 0) {
    // Download parts concurrently then merge in order
    const totalParts = fileObj.parts.length;
    const partPaths = new Array(totalParts);
    let next = 0;

    async function partWorker() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const i = next++;
        if (i >= totalParts) return;
        const part = fileObj.parts[i];
        const partUrl = `${baseUrl.replace(/\/$/, '')}/${part.path.replace(/\\/g, '/')}`;
        const tmpPart = `${targetPath}.part${i}`;
        await downloadToFile(partUrl, tmpPart, (rec, tot) => emit('progress:part', { path: fileObj.path, part: i, totalParts, received: rec, total: tot }), 1, token);
        const hash = await sha256File(tmpPart);
        if (hash.toLowerCase() !== String(part.checksum).toLowerCase()) {
          throw new Error(`Checksum mismatch for ${part.path}`);
        }
        partPaths[i] = tmpPart;
      }
    }

    const workers = Array.from({ length: Math.max(1, partConcurrency) }, () => partWorker());
    await Promise.all(workers);
    // Merge safely (avoid ending the stream between parts)
    emit('progress:merge:start', { path: fileObj.path, parts: partPaths.length });
    const out = fs.createWriteStream(targetPath);
    for (const p of partPaths) {
      const idx = partPaths.indexOf(p);
      emit('progress:merge:part', { path: fileObj.path, part: idx, totalParts: partPaths.length });
      await new Promise((resolve, reject) => {
        const read = fs.createReadStream(p);
        read.on('error', reject);
        out.on('error', reject);
        read.on('end', () => {
          try { fs.unlinkSync(p); } catch {}
          resolve();
        });
        read.pipe(out, { end: false });
      });
    }
    await new Promise((resolve, reject) => {
      out.on('error', reject);
      out.on('finish', resolve);
      out.end();
    });
  } else {
    const fileUrl = `${baseUrl.replace(/\/$/, '')}/${fileObj.path.replace(/\\/g, '/')}`;
    await downloadToFile(fileUrl, targetPath, (rec, tot) => emit('progress:file', { path: fileObj.path, received: rec, total: tot }), 1, token);
  }

  // Verify final file
  emit('progress:verify', { path: fileObj.path });
  const finalHash = await sha256File(targetPath);
  if (finalHash.toLowerCase() !== String(fileObj.checksum).toLowerCase()) {
    throw new Error(`Checksum mismatch for ${fileObj.path}`);
  }
}

export async function downloadAll(baseUrl, checksums, installDir, emit, includeOptional = false, concurrency = 4, partConcurrency = 4, token) {
  const files = (checksums.files || []).filter((f) => includeOptional || !f.optional);
  const total = files.length;
  let nextIndex = 0;
  let completed = 0;

  async function worker(workerId) {
    while (true) {
      const i = nextIndex++;
      if (i >= total) return;
      const f = files[i];
      emit('progress:start', { index: i, total, path: f.path, completed });
      await downloadFileObject(baseUrl, f, installDir, emit, partConcurrency, token);
      completed += 1;
      emit('progress:done', { index: i, total, path: f.path, completed });
    }
  }

  const pool = Array.from({ length: Math.max(1, concurrency) }, (_, id) => worker(id));
  await Promise.all(pool);
}