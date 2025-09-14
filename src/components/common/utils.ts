// Utility functions for the launcher

export function sanitizeFolderName(s: string): string {
  return String(s || 'mod').replace(/[\\/:*?"<>|]/g, '_');
}

export function deriveFolderFromDownloadUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    if (last.includes('.')) {
      const withoutExt = last.replace(/\.[^.]*$/, '');
      return withoutExt || null;
    }
    return last || null;
  } catch {
    return null;
  }
}

export function compareVersions(a?: string|null, b?: string|null): number {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(pa.length, pb.length);
  for (let i = 0; i < maxLen; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

export function deriveBaseFromDir(dir: string, channelName: string): string {
  if (!dir) return '';
  const norm = dir.replace(/\\+$/,'');
  if (norm.endsWith(`\\${channelName}`)) {
    return norm.slice(0, -channelName.length - 1);
  }
  return norm;
}
