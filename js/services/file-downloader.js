import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import https from 'node:https';

const streamPipeline = promisify(pipeline);
function normalizeRelative(p) {
  const s = String(p || '');
  // Convert backslashes to forward slashes, then strip any leading slashes
  return s.replace(/\\/g, '/').replace(/^\/+/, '');
}
function pathKey(p) {
  return String(p || '').replace(/\\/g, '/').toLowerCase();
}

// Track in-flight downloads across concurrent downloadAll invocations
const activePromises = new Map();

// Optimized HTTP agent for better download performance
const keepAliveAgent = new https.Agent({ 
  keepAlive: true, 
  maxSockets: 64,        // Increased from 32 for more parallel connections
  maxFreeSockets: 32,    // Increased from 16 
  keepAliveMsecs: 60000, // Increased from 30s for longer connection reuse
  scheduling: 'fifo'     // Better connection reuse strategy
});

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
    const req = https.get(url, { agent: keepAliveAgent }, (res) => {
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
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('JSON fetch timeout'));
    });
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
  'ENOTFOUND', 'ECONNREFUSED', 'EHOSTDOWN', 'ENETDOWN', // Additional network error codes
]);

async function downloadToFile(url, dest, onProgress, attempt = 1, token, resumeFrom = 0, expectedTotal = 0) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest, { flags: resumeFrom > 0 ? 'a' : 'w' });
    if (token?.cancelled) { file.close(() => {}); return reject(new Error('cancelled')); }
    const reqOptions = { agent: keepAliveAgent };
    if (resumeFrom > 0) {
      reqOptions.headers = { Range: `bytes=${resumeFrom}-` };
    }
    const req = https.get(url, reqOptions, (res) => {
      if (res.statusCode !== 200) {
        if (resumeFrom > 0 && res.statusCode === 206) {
          // ok partial content
        } else {
          file.close(() => {});
          // If server ignored Range and returned 200 for a resume request, fallback to full restart
          if (resumeFrom > 0 && res.statusCode === 200) {
            try { fs.unlinkSync(dest); } catch {}
            const backoff = Math.min(2000 * attempt, 10000);
            res.resume();
            try { req.destroy(new Error('restart:range-ignored')); } catch {}
            return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token, 0, expectedTotal)));
          }
          fs.unlink(dest, () => {});
          if (res.statusCode && [429,500,502,503,504].includes(res.statusCode) && attempt < 5) {
            const backoff = Math.min(2000 * attempt, 10000);
            res.resume();
            return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token, resumeFrom, expectedTotal)));
          }
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
      }
      const contentLen = Number(res.headers['content-length'] || 0);
      const total = expectedTotal > 0
        ? expectedTotal
        : (resumeFrom > 0 ? (resumeFrom + contentLen) : contentLen);
      let received = 0;
      let lastProgressAt = Date.now();
      // More aggressive stall timeout to detect and recover from slow connections faster
      const stallMs = attempt <= 2 ? 30000 : 45000;
      const watchdog = setInterval(() => {
        if (token?.cancelled) return;
        if (Date.now() - lastProgressAt > stallMs) {
          try { const err = new Error('stalled'); err.code = 'ETIMEDOUT'; req.destroy(err); } catch {}
        }
      }, 10000);
      res.on('data', (chunk) => {
        received += chunk.length;
        lastProgressAt = Date.now();
        if (onProgress) onProgress(Math.min(resumeFrom + received, total || (resumeFrom + received)), total || 0);
      });
      res.on('aborted', async () => {
        const fileClosed = new Promise((r) => file.close(() => r()));
        try { clearInterval(watchdog); } catch {}
        try { await fileClosed; } catch {}
        if (attempt < 5) {
          const backoff = Math.min(2000 * attempt, 10000);
          return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token, resumeFrom + received, expectedTotal)));
        }
        reject(new Error('response aborted'));
      });
      streamPipeline(res, file)
        .then(() => { try { clearInterval(watchdog); } catch {}; resolve(); })
        .catch((e) => { try { clearInterval(watchdog); } catch {}; reject(e); });
    });
    token?.requests.add(req);
    req.on('socket', (s) => { 
      try { 
        s.setKeepAlive(true, 60000); 
        s.setNoDelay(true);
        // Optimize socket buffer sizes for better throughput
        s.setRecvBufferSize && s.setRecvBufferSize(64 * 1024);
        s.setSendBufferSize && s.setSendBufferSize(64 * 1024);
      } catch {} 
    });
    req.on('close', () => token?.requests.delete(req));
    req.setTimeout(90000, () => { try { const err = new Error('Request timeout'); err.code = 'ETIMEDOUT'; req.destroy(err); } catch {} });
    if (token?.cancelled) { try { req.destroy(new Error('cancelled')); } catch {} }
    req.on('error', async (err) => {
      const code = err?.code;
      const canRetry = attempt < 8 && (code && RETRYABLE_ERROR_CODES.has(String(code))); // Increased from 5 to 8 attempts
      const fileClosed = new Promise((r) => { try { file.close(() => r()); } catch { r(); } });
      try { await fileClosed; } catch {}
      if (canRetry) {
        // Improved exponential backoff with jitter to avoid thundering herd
        const baseBackoff = Math.min(1000 * Math.pow(1.5, attempt), 15000);
        const jitter = Math.random() * 1000;
        const backoff = baseBackoff + jitter;
        let newResume = resumeFrom;
        try { const st = fs.statSync(dest); newResume = st.size; } catch {}
        return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token, newResume, expectedTotal)));
      }
      reject(err);
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
  const relFilePath = normalizeRelative(fileObj.path).split('/').join(path.sep);
  const targetPath = path.join(installDir, relFilePath);
  ensureDir(path.dirname(targetPath));

  if (await fileExistsAndValid(targetPath, fileObj.checksum, fileObj.size)) {
    emit('progress:skip', { path: fileObj.path });
    return { downloadComplete: true, verificationComplete: true, targetPath };
  }

  if (token?.cancelled) throw new Error('cancelled');

  if (Array.isArray(fileObj.parts) && fileObj.parts.length > 0) {
    const totalParts = fileObj.parts.length;
    const partPaths = new Array(totalParts);
    let next = 0;
    const started = new Set();

    async function partWorker() {
      while (true) {
        const i = next++;
        if (i >= totalParts) return;
        if (started.has(i)) continue;
        started.add(i);
        const part = fileObj.parts[i];
        const partRel = normalizeRelative(part.path);
        const partUrl = `${baseUrl.replace(/\/$/, '')}/${partRel}`;
        const tmpPart = `${targetPath}.part${i}`;
        // If temp part already exists and matches checksum, reuse it
        try {
          if (fs.existsSync(tmpPart)) {
            const existingHash = await sha256File(tmpPart);
            if (existingHash.toLowerCase() === String(part.checksum).toLowerCase()) {
              emit('progress:part', { path: fileObj.path, part: i, totalParts, received: Number(part.size || 0), total: Number(part.size || 0) });
              partPaths[i] = tmpPart;
              continue;
            } else {
              try { fs.unlinkSync(tmpPart); } catch {}
            }
          }
        } catch {}

        // Download with checksum retry; subtract bytes from failed attempts to keep global counters accurate
        let attempts = 0;
        while (true) {
          if (token?.cancelled) throw new Error('cancelled');
          attempts += 1;
          let attemptBytes = 0;
          let last = 0;
          try {
            let existing = 0;
            try { const st = fs.statSync(tmpPart); existing = st.size; } catch {}
            const expected = Number(part.size || 0);
            // If existing exceeds expected (corrupt), restart from 0
            if (expected > 0 && existing > expected) { try { fs.unlinkSync(tmpPart); existing = 0; } catch {} }
            await downloadToFile(partUrl, tmpPart, (rec, tot) => {
              const delta = Math.max(0, rec - last);
              last = rec;
              try { if (delta > 0) emit('progress:bytes', { delta }); } catch {}
              attemptBytes += delta;
              const totalForPart = expected || tot || 0;
              emit('progress:part', { path: fileObj.path, part: i, totalParts, received: Math.min(rec, totalForPart || rec), total: totalForPart });
            }, 1, token, existing, expected);
          } catch (e) {
            try { fs.unlinkSync(tmpPart); } catch {}
            // Undo counted bytes for failed attempt
            try { if (attemptBytes > 0) emit('progress:bytes', { delta: -attemptBytes }); } catch {}
            try { emit('progress:part:reset', { path: fileObj.path, part: i, totalParts }); } catch {}
            const backoff = Math.min(2000 * attempts, 10000);
            await delay(backoff);
            continue; // retry
          }

          const hash = await sha256File(tmpPart);
          if (hash.toLowerCase() === String(part.checksum).toLowerCase()) {
            break;
          }
          try { fs.unlinkSync(tmpPart); } catch {}
          // Undo counted bytes for failed attempt
          try { if (attemptBytes > 0) emit('progress:bytes', { delta: -attemptBytes }); } catch {}
          try { emit('progress:part:reset', { path: fileObj.path, part: i, totalParts }); } catch {}
          const backoff = Math.min(2000 * attempts, 10000);
          await delay(backoff);
          // and loop to retry
        }
        partPaths[i] = tmpPart;
      }
    }

    const workers = Array.from({ length: Math.max(1, partConcurrency) }, () => partWorker());
    await Promise.all(workers);
    
    // For multipart files, return info that parts are downloaded and merging can start
    // This allows the next download to begin while this file is merging and verifying
    return { 
      downloadComplete: true, 
      verificationComplete: false, 
      targetPath,
      mergeAndVerifyAsync: async () => {
        emit('progress:merge:start', { path: fileObj.path, parts: partPaths.length });
        const out = fs.createWriteStream(targetPath);
        for (let idx = 0; idx < partPaths.length; idx++) {
          const p = partPaths[idx];
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
        try { emit('progress:merge:done', { path: fileObj.path }); } catch {}
        
        // Now verify the merged file
        emit('progress:verify', { path: fileObj.path });
        const finalHash = await sha256File(targetPath);
        if (finalHash.toLowerCase() !== String(fileObj.checksum).toLowerCase()) {
          throw new Error(`Checksum mismatch for ${fileObj.path}`);
        }
        
        // Final cleanup: ensure all part files are removed after successful verification
        try {
          const files = fs.readdirSync(path.dirname(targetPath));
          const baseName = path.basename(targetPath);
          files.forEach(file => {
            if (file.startsWith(baseName + '.part')) {
              try { fs.unlinkSync(path.join(path.dirname(targetPath), file)); } catch {}
            }
          });
        } catch {}
        
        return { verificationComplete: true, targetPath, filePath: fileObj.path };
      }
    };
  } else {
    const fileRel = normalizeRelative(fileObj.path);
    const fileUrl = `${baseUrl.replace(/\/$/, '')}/${fileRel}`;
    // Download to a temp file with checksum verification and retry; subtract bytes from failed attempts
    let attempts = 0;
    while (true) {
      attempts += 1;
      let attemptBytes = 0;
      let last = 0;
      const tmpPath = `${targetPath}.download`;
      let existing = 0;
      try { const st = fs.statSync(tmpPath); existing = st.size; } catch {}
      const expected = Number(fileObj.size || 0);
      if (expected > 0 && existing > expected) { try { fs.unlinkSync(tmpPath); existing = 0; } catch {} }
      await downloadToFile(fileUrl, tmpPath, (rec, tot) => {
        const delta = Math.max(0, rec - last);
        last = rec;
        try { if (delta > 0) emit('progress:bytes', { delta }); } catch {}
        attemptBytes += delta;
        const totalForFile = expected || tot || 0;
        emit('progress:file', { path: fileObj.path, received: Math.min(rec, totalForFile || rec), total: totalForFile });
      }, 1, token, existing, expected);
      const fhash = await sha256File(tmpPath);
      if (fhash.toLowerCase() === String(fileObj.checksum).toLowerCase()) break;
      try { fs.unlinkSync(tmpPath); } catch {}
      try { if (attemptBytes > 0) emit('progress:bytes', { delta: -attemptBytes }); } catch {}
      if (attempts >= 2) throw new Error(`Checksum mismatch for ${fileObj.path}`);
    }
    // Atomically replace target with verified temp
    try { fs.unlinkSync(targetPath); } catch {}
    fs.renameSync(`${targetPath}.download`, targetPath);
  }

  emit('progress:verify', { path: fileObj.path });
  const finalHash = await sha256File(targetPath);
  if (finalHash.toLowerCase() !== String(fileObj.checksum).toLowerCase()) {
    throw new Error(`Checksum mismatch for ${fileObj.path}`);
  }
  return { downloadComplete: true, verificationComplete: true, targetPath };
}

export async function downloadAll(baseUrl, checksums, installDir, emit, includeOptional = false, concurrency = 4, partConcurrency = 4, token, isPausedFn) {
  // De-duplicate by path to avoid downloading same file multiple times
  const seen = new Set();
  const filtered = [];
  for (const f of (checksums.files || [])) {
    if (!(includeOptional || !f.optional)) continue;
    const key = pathKey(f.path);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(f);
  }
  const singles = filtered.filter((f) => !(Array.isArray(f.parts) && f.parts.length > 0));
  const multis = filtered.filter((f) => Array.isArray(f.parts) && f.parts.length > 0);
  const files = singles.concat(multis);
  const total = files.length;
  let completed = 0;
  const totalBytes = files.reduce((sum, f) => {
    const size = Number(f.size || 0);
    if (size > 0) return sum + size;
    if (Array.isArray(f.parts) && f.parts.length) {
      return sum + f.parts.reduce((s, p) => s + Number(p.size || 0), 0);
    }
    return sum;
  }, 0);
  try { emit('progress:bytes:total', { totalBytes }); } catch {}

  async function processGroup(group, offset, groupConcurrency, allowOverlappedVerification = false) {
    let nextLocal = 0;
    const pendingVerifications = [];
    
    async function worker() {
      while (true) {
        // Check if paused and wait
        while (isPausedFn && isPausedFn()) {
          await delay(100); // Check every 100ms
          if (token?.cancelled) return;
        }
        
        const iLocal = nextLocal++;
        if (iLocal >= group.length) return;
        const f = group[iLocal];
        const globalIndex = offset + iLocal;
        const key = pathKey(f.path);
        const doOnce = async () => downloadFileObject(baseUrl, f, installDir, emit, partConcurrency, token);
        let awaitingExisting = false;
        let p = activePromises.get(key);
        if (!p) {
          emit('progress:start', { index: globalIndex, total, path: f.path, completed });
          p = (async () => {
            try {
              const result = await doOnce();
              
              // If this is a multipart file and we have overlapped processing enabled
              if (allowOverlappedVerification && result?.mergeAndVerifyAsync) {
                // Start merge and verification asynchronously but don't wait for it
                const mergeVerifyPromise = result.mergeAndVerifyAsync().then((verifyResult) => {
                  // Emit progress:done after verification completes for multipart files
                  if (verifyResult?.filePath) {
                    completed += 1;
                    emit('progress:done', { index: globalIndex, total, path: verifyResult.filePath, completed });
                  }
                  return verifyResult;
                }).catch((err) => {
                  const message = String(err?.message || err || 'error');
                  if (message.includes('cancelled')) throw err;
                  try {
                    const targetPath = path.join(installDir, f.path.replace(/\\/g, path.sep));
                    try { fs.unlinkSync(targetPath); } catch {}
                    // Clean up any remaining part files from failed merge/verify
                    try {
                      const files = fs.readdirSync(path.dirname(targetPath));
                      const baseName = path.basename(targetPath);
                      files.forEach(file => {
                        if (file.startsWith(baseName + '.part')) {
                          try { fs.unlinkSync(path.join(path.dirname(targetPath), file)); } catch {}
                        }
                      });
                    } catch {}
                    return doOnce().then(r => r.mergeAndVerifyAsync ? r.mergeAndVerifyAsync().then((retryResult) => {
                      // Emit progress:done for successful retry
                      if (retryResult?.filePath) {
                        completed += 1;
                        emit('progress:done', { index: globalIndex, total, path: retryResult.filePath, completed });
                      }
                      return retryResult;
                    }) : r);
                  } catch (err2) {
                    try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                    throw err2;
                  }
                });
                pendingVerifications.push(mergeVerifyPromise);
                // Don't increment completed here for multipart files - it will be done after verification
                return { ...result, skipProgressDone: true };
              }
              
              return result;
            } catch (err) {
              const message = String(err?.message || err || 'error');
              if (message.includes('cancelled')) throw err;
              try {
                const targetPath = path.join(installDir, f.path.replace(/\\/g, path.sep));
                try { fs.unlinkSync(targetPath); } catch {}
                const retryResult = await doOnce();
                
                // Handle retry with overlapped merge and verification
                if (allowOverlappedVerification && retryResult?.mergeAndVerifyAsync) {
                  const mergeVerifyPromise = retryResult.mergeAndVerifyAsync().then((verifyResult) => {
                    // Emit progress:done after verification completes for retry
                    if (verifyResult?.filePath) {
                      completed += 1;
                      emit('progress:done', { index: globalIndex, total, path: verifyResult.filePath, completed });
                    }
                    return verifyResult;
                  }).catch((err2) => {
                    // Clean up part files on final failure
                    try {
                      const targetPath = path.join(installDir, f.path.replace(/\\/g, path.sep));
                      const files = fs.readdirSync(path.dirname(targetPath));
                      const baseName = path.basename(targetPath);
                      files.forEach(file => {
                        if (file.startsWith(baseName + '.part')) {
                          try { fs.unlinkSync(path.join(path.dirname(targetPath), file)); } catch {}
                        }
                      });
                    } catch {}
                    try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                    throw err2;
                  });
                  pendingVerifications.push(mergeVerifyPromise);
                  return { ...retryResult, skipProgressDone: true };
                }
                
                return retryResult;
              } catch (err2) {
                try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                throw err2;
              }
            }
          })();
          activePromises.set(key, p);
        } else {
          awaitingExisting = true;
        }
        let result;
        try {
          result = await p;
        } finally {
          if (!awaitingExisting) activePromises.delete(key);
        }
        
        // Only emit progress:done if this isn't a multipart file with overlapped verification
        if (!result?.skipProgressDone) {
          completed += 1;
          emit('progress:done', { index: globalIndex, total, path: f.path, completed });
        }
        // Small delay to allow agent to reuse sockets gracefully between last multipart and next
        await delay(10);
      }
    }
    const pool = Array.from({ length: Math.max(1, groupConcurrency) }, () => worker());
    await Promise.all(pool);
    
    // Wait for all pending verifications to complete
    if (pendingVerifications.length > 0) {
      await Promise.all(pendingVerifications);
    }
  }

  // Stage 1: regular files with full concurrency
  await processGroup(singles, 0, Math.max(1, concurrency));
  // Ensure no lingering retries for singles before starting multipart stage
  if (activePromises.size > 0) {
    try { await Promise.all([...activePromises.values()]); } catch {}
  }
  // Stage 2: multipart files, serialized (one at a time) with overlapped merge/verification
  await processGroup(multis, singles.length, 1, true);
}
