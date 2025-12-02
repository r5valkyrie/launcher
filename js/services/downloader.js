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

// Global download speed limiter using token bucket algorithm
class RateLimiter {
  constructor() {
    this.maxBytesPerSecond = 0; // 0 = unlimited
    this.tokens = 0;
    this.lastRefill = Date.now();
  }

  setMaxSpeed(bytesPerSecond) {
    this.maxBytesPerSecond = Math.max(0, bytesPerSecond);
    this.tokens = this.maxBytesPerSecond;
  }

  async consumeTokens(bytes) {
    if (this.maxBytesPerSecond <= 0) {
      return; // unlimited speed
    }

    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    
    // Refill tokens based on time passed
    this.tokens = Math.min(
      this.maxBytesPerSecond,
      this.tokens + timePassed * this.maxBytesPerSecond
    );
    this.lastRefill = now;

    // If we don't have enough tokens, wait
    if (bytes > this.tokens) {
      const deficit = bytes - this.tokens;
      const waitMs = (deficit / this.maxBytesPerSecond) * 1000;
      await delay(waitMs);
      this.tokens = 0;
    } else {
      this.tokens -= bytes;
    }
  }
}

const globalRateLimiter = new RateLimiter();

export function setGlobalDownloadSpeed(bytesPerSecond) {
  globalRateLimiter.setMaxSpeed(bytesPerSecond);
}

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
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // Check if the error is because the parent path doesn't exist (e.g., drive not mounted)
    const code = e?.code;
    if (code === 'ENOENT') {
      // Try to identify which part of the path is missing
      const parts = dir.split(path.sep).filter(Boolean);
      let checkPath = '';
      for (const part of parts) {
        checkPath = checkPath ? path.join(checkPath, part) : (part.includes(':') ? part + path.sep : part);
        try {
          fs.accessSync(checkPath);
        } catch {
          throw new Error(`Cannot create directory: parent path "${checkPath}" does not exist or is not accessible. Please ensure the drive is available and you have write permissions.`);
        }
      }
    }
    throw e;
  }
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
  'EPERM', 'EBUSY', 'EACCES', // Windows file permission/locking errors
]);

async function downloadToFile(url, dest, onProgress, attempt = 1, token, resumeFrom = 0, expectedTotal = 0) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    
    let file;
    try {
      file = fs.createWriteStream(dest, { flags: resumeFrom > 0 ? 'a' : 'w' });
    } catch (e) {
      // File might be locked, retry after delay
      if (attempt < 8 && (e.code === 'EPERM' || e.code === 'EBUSY' || e.code === 'EACCES')) {
        const backoff = Math.min(1000 * attempt, 5000);
        return delay(backoff).then(() => resolve(downloadToFile(url, dest, onProgress, attempt + 1, token, resumeFrom, expectedTotal)));
      }
      return reject(e);
    }
    
    if (token?.cancelled) { file.close(() => {}); return reject(new Error('cancelled')); }
    
    // Prevent double-settling of the promise
    let settled = false;
    const safeResolve = (v) => { if (!settled) { settled = true; resolve(v); } };
    const safeReject = (e) => { if (!settled) { settled = true; reject(e); } };
    
    const reqOptions = { agent: keepAliveAgent };
    if (resumeFrom > 0) {
      reqOptions.headers = { Range: `bytes=${resumeFrom}-` };
    }
    
    let received = 0;
    let watchdog = null;
    
    const closeFileAsync = () => new Promise((r) => { 
      try { file.close(() => r()); } catch { r(); } 
    });
    
    const cleanupAndRetry = async (newResumeFrom, deleteFile = false) => {
      try { if (watchdog) clearInterval(watchdog); } catch {}
      try { await closeFileAsync(); } catch {}
      // Small delay to let Windows release file handles
      await delay(100);
      if (deleteFile) {
        try { fs.unlinkSync(dest); } catch {}
      }
      if (attempt < 8) {
        const baseBackoff = Math.min(1000 * Math.pow(1.5, attempt), 15000);
        const jitter = Math.random() * 1000;
        const backoff = baseBackoff + jitter;
        await delay(backoff);
        safeResolve(downloadToFile(url, dest, onProgress, attempt + 1, token, newResumeFrom, expectedTotal));
        return true;
      }
      return false; // Could not retry
    };
    
    const req = https.get(url, reqOptions, (res) => {
      if (res.statusCode !== 200) {
        if (resumeFrom > 0 && res.statusCode === 206) {
          // ok partial content
        } else {
          // Mark as settled before handling to prevent error handler from double-handling
          settled = true;
          
          // If server ignored Range and returned 200 for a resume request, fallback to full restart
          if (resumeFrom > 0 && res.statusCode === 200) {
            res.resume();
            cleanupAndRetry(0, true).then((retried) => {
              if (!retried) reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            });
            return;
          }
          // Handle 416 Range Not Satisfiable - delete partial file and restart from scratch
          if (resumeFrom > 0 && res.statusCode === 416) {
            res.resume();
            cleanupAndRetry(0, true).then((retried) => {
              if (!retried) reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            });
            return;
          }
          // Retryable server errors
          if (res.statusCode && [429,500,502,503,504].includes(res.statusCode) && attempt < 5) {
            res.resume();
            cleanupAndRetry(resumeFrom, false).then((retried) => {
              if (!retried) reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            });
            return;
          }
          // Non-retryable error
          closeFileAsync().then(() => {
            fs.unlink(dest, () => {});
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          });
          res.resume();
          return;
        }
      }
      const contentLen = Number(res.headers['content-length'] || 0);
      const total = expectedTotal > 0
        ? expectedTotal
        : (resumeFrom > 0 ? (resumeFrom + contentLen) : contentLen);
      let lastProgressAt = Date.now();
      // More aggressive stall timeout to detect and recover from slow connections faster
      const stallMs = attempt <= 2 ? 30000 : 45000;
      watchdog = setInterval(() => {
        if (token?.cancelled) return;
        if (Date.now() - lastProgressAt > stallMs) {
          try { const err = new Error('stalled'); err.code = 'ETIMEDOUT'; req.destroy(err); } catch {}
        }
      }, 10000);
      res.on('data', async (chunk) => {
        // Apply global rate limiting
        await globalRateLimiter.consumeTokens(chunk.length);
        
        received += chunk.length;
        lastProgressAt = Date.now();
        if (onProgress) onProgress(Math.min(resumeFrom + received, total || (resumeFrom + received)), total || 0);
      });
      res.on('aborted', async () => {
        const retried = await cleanupAndRetry(resumeFrom + received);
        if (!retried) safeReject(new Error('response aborted'));
      });
      streamPipeline(res, file)
        .then(() => { try { if (watchdog) clearInterval(watchdog); } catch {}; safeResolve(); })
        .catch(async (e) => {
          try { if (watchdog) clearInterval(watchdog); } catch {};
          // Handle aborted/socket close errors as retryable
          const msg = String(e?.message || e || '').toLowerCase();
          if (msg.includes('aborted') || msg.includes('socket') || msg.includes('closed')) {
            const retried = await cleanupAndRetry(resumeFrom + received);
            if (!retried) safeReject(e);
          } else {
            safeReject(e);
          }
        });
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
      const msg = String(err?.message || '').toLowerCase();
      const isAbortError = msg.includes('aborted') || msg.includes('socket') || msg.includes('closed');
      const canRetry = attempt < 8 && (isAbortError || (code && RETRYABLE_ERROR_CODES.has(String(code))));
      
      if (canRetry) {
        let newResume = resumeFrom;
        try { const st = fs.statSync(dest); newResume = st.size; } catch {}
        const retried = await cleanupAndRetry(newResume);
        if (!retried) safeReject(err);
      } else {
        const fileClosed = new Promise((r) => { try { file.close(() => r()); } catch { r(); } });
        try { await fileClosed; } catch {}
        safeReject(err);
      }
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
        
        // Add timeout wrapper to prevent hanging indefinitely
        const mergeTimeout = 5 * 60 * 1000; // 5 minutes max for merge
        const mergeWithTimeout = async () => {
          const out = fs.createWriteStream(targetPath);
          let outErrorHandler = null;
          
          try {
            for (let idx = 0; idx < partPaths.length; idx++) {
              const p = partPaths[idx];
              if (!p) {
                throw new Error(`Part ${idx} path is undefined for ${fileObj.path}`);
              }
              emit('progress:merge:part', { path: fileObj.path, part: idx, totalParts: partPaths.length });
              await new Promise((resolve, reject) => {
                // Check if part file exists
                if (!fs.existsSync(p)) {
                  reject(new Error(`Part file missing: ${p}`));
                  return;
                }
                const read = fs.createReadStream(p);
                read.on('error', reject);
                // Only add error handler once, not per iteration
                if (!outErrorHandler) {
                  outErrorHandler = (e) => reject(e);
                  out.on('error', outErrorHandler);
                }
                read.on('end', () => {
                  try { fs.unlinkSync(p); } catch {}
                  resolve();
                });
                read.pipe(out, { end: false });
              });
            }
            await new Promise((resolve, reject) => {
              out.on('finish', resolve);
              out.end();
            });
          } catch (e) {
            // Clean up write stream on error
            try { out.destroy(); } catch {}
            throw e;
          }
        };
        
        // Race merge against timeout
        await Promise.race([
          mergeWithTimeout(),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Merge timeout for ${fileObj.path}`)), mergeTimeout))
        ]);
        
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
                }).catch(async (err) => {
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
                    const retryResult = await doOnce();
                    if (retryResult.mergeAndVerifyAsync) {
                      const verifyResult = await retryResult.mergeAndVerifyAsync();
                      // Emit progress:done for successful retry
                      if (verifyResult?.filePath) {
                        completed += 1;
                        emit('progress:done', { index: globalIndex, total, path: verifyResult.filePath, completed });
                      }
                      return verifyResult;
                    }
                    return retryResult;
                  } catch (err2) {
                    // Emit error AND done so the UI removes the item
                    try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                    try { emit('progress:done', { index: globalIndex, total, path: f.path, completed, error: true }); } catch {}
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
                    // Emit error AND done so the UI removes the item
                    try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                    try { emit('progress:done', { index: globalIndex, total, path: f.path, completed, error: true }); } catch {}
                    throw err2;
                  });
                  pendingVerifications.push(mergeVerifyPromise);
                  return { ...retryResult, skipProgressDone: true };
                }
                
                return retryResult;
              } catch (err2) {
                // Emit error AND done so the UI removes the item
                try { emit('progress:error', { path: f.path, message: String(err2?.message || err2) }); } catch {}
                try { emit('progress:done', { index: globalIndex, total, path: f.path, completed, error: true }); } catch {}
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
    // Use allSettled to ensure all complete even if some fail, then check for failures
    if (pendingVerifications.length > 0) {
      const results = await Promise.allSettled(pendingVerifications);
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        // Log failures but don't throw - they were already emitted as progress:error
        for (const f of failures) {
          console.error('Verification failed:', f.reason?.message || f.reason);
        }
      }
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
