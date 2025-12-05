// Mod-related utility functions
import pako from 'pako';

// Thunderstore Profile API
const THUNDERSTORE_PROFILE_CREATE_URL = 'https://thunderstore.io/api/experimental/legacyprofile/create/';
const THUNDERSTORE_PROFILE_GET_URL = 'https://thunderstore.io/api/experimental/legacyprofile/get/';

type InstalledMod = {
  id?: string;
  name: string;
  enabled: boolean;
  version?: string;
};

// Dependency types
export type ParsedDependency = {
  author: string;
  name: string;
  version: string;
  fullString: string;
};

export type ResolvedDependency = ParsedDependency & {
  pack: any | null;
  isInstalled: boolean;
  installedVersion: string | null;
  needsUpdate: boolean;
  latestVersion: string | null;
};

export type DependencyTree = {
  mod: any;
  version: any;
  dependencies: ResolvedDependency[];
  missingDependencies: ParsedDependency[];
  toInstall: ResolvedDependency[];
  toUpdate: ResolvedDependency[];
  alreadyInstalled: ResolvedDependency[];
};

/**
 * Parse a Thunderstore dependency string like "Author-PackageName-1.0.0"
 */
export function parseDependencyString(dep: string): ParsedDependency | null {
  if (!dep || typeof dep !== 'string') return null;
  const parts = dep.split('-');
  if (parts.length < 3) return null;
  
  // Format: Author-PackageName-Version (version can have dashes like 1.0.0-beta)
  const author = parts[0];
  const name = parts[1];
  const version = parts.slice(2).join('-');
  
  return {
    author,
    name,
    version,
    fullString: dep,
  };
}

/**
 * Get dependencies from a mod version
 */
export function getVersionDependencies(version: any): ParsedDependency[] {
  const deps = version?.dependencies;
  if (!Array.isArray(deps)) return [];
  
  return deps
    .map((d: string) => parseDependencyString(d))
    .filter((d): d is ParsedDependency => d !== null);
}

/**
 * Resolve dependencies against available mods and installed mods
 */
export function resolveDependencies(
  dependencies: ParsedDependency[],
  allMods: any[],
  installedMods: any[],
  compareVersions: (a: string | null, b: string | null) => number
): ResolvedDependency[] {
  return dependencies.map(dep => {
    // Find the pack in allMods by matching author-name pattern
    const pack = allMods.find((p: any) => {
      const fullName = String(p?.full_name || '').toLowerCase();
      const searchPattern = `${dep.author}-${dep.name}`.toLowerCase();
      return fullName === searchPattern || fullName.startsWith(searchPattern + '-');
    });
    
    // Check if installed
    const installed = installedMods.find((m: any) => {
      const modName = String(m?.name || m?.id || '').toLowerCase();
      return modName === dep.name.toLowerCase() || 
             modName === `${dep.author}-${dep.name}`.toLowerCase();
    });
    
    const installedVersion = installed?.version || null;
    const latestVersion = pack?.versions?.[0]?.version_number || null;
    
    // Check if needs update (installed version is less than required version)
    const needsUpdate = installed && installedVersion && 
      compareVersions(installedVersion, dep.version) < 0;
    
    return {
      ...dep,
      pack,
      isInstalled: !!installed,
      installedVersion,
      needsUpdate: !!needsUpdate,
      latestVersion,
    };
  });
}

/**
 * Build a complete dependency tree for a mod installation
 */
export function buildDependencyTree(
  pack: any,
  version: any,
  allMods: any[],
  installedMods: any[],
  compareVersions: (a: string | null, b: string | null) => number
): DependencyTree {
  const rawDeps = getVersionDependencies(version);
  const resolved = resolveDependencies(rawDeps, allMods, installedMods, compareVersions);
  
  const missingDependencies = resolved.filter(d => !d.pack);
  const toInstall = resolved.filter(d => d.pack && !d.isInstalled);
  const toUpdate = resolved.filter(d => d.pack && d.isInstalled && d.needsUpdate);
  const alreadyInstalled = resolved.filter(d => d.isInstalled && !d.needsUpdate);
  
  return {
    mod: pack,
    version,
    dependencies: resolved,
    missingDependencies: missingDependencies.map(d => ({
      author: d.author,
      name: d.name,
      version: d.version,
      fullString: d.fullString,
    })),
    toInstall,
    toUpdate,
    alreadyInstalled,
  };
}

/**
 * Find mods that depend on a given mod (for uninstall warnings)
 */
export function findDependentMods(
  modName: string,
  installedMods: any[],
  allMods: any[]
): { mod: any; pack: any }[] {
  const dependents: { mod: any; pack: any }[] = [];
  const targetName = modName.toLowerCase();
  
  for (const installed of installedMods) {
    const pack = getPackByName(installed.name || installed.id, allMods);
    if (!pack) continue;
    
    const latestVersion = pack?.versions?.[0];
    const deps = getVersionDependencies(latestVersion);
    
    const dependsOnTarget = deps.some(dep => 
      dep.name.toLowerCase() === targetName ||
      `${dep.author}-${dep.name}`.toLowerCase().includes(targetName)
    );
    
    if (dependsOnTarget) {
      dependents.push({ mod: installed, pack });
    }
  }
  
  return dependents;
}

/**
 * Check if a dependency string represents a "framework" or common dependency
 * that many mods use (useful for prioritizing in UI)
 */
export function isFrameworkDependency(dep: ParsedDependency): boolean {
  const frameworkNames = ['bepinex', 'bepinexpack', 'r2modman', 'hookgen'];
  return frameworkNames.some(f => dep.name.toLowerCase().includes(f));
}

// ============================================
// MOD PROFILES
// ============================================

export type ModProfile = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  mods: ModProfileEntry[];
};

export type ModProfileEntry = {
  name: string;
  fullName?: string; // Author-ModName format for reliable matching
  version?: string;
  enabled: boolean;
};

/**
 * Generate a unique profile ID
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a profile from currently installed mods
 * @param allMods - Optional Thunderstore catalog to look up full names
 */
export function createProfileFromMods(
  name: string,
  installedMods: any[],
  description?: string,
  allMods?: any[]
): ModProfile {
  const now = Date.now();
  // Only include enabled mods in profiles
  const enabledMods = installedMods.filter(m => m.enabled);
  
  return {
    id: generateProfileId(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    mods: enabledMods.map(m => {
      const modName = m.name || m.id || '';
      const folder = m.folder || '';
      
      // Try to find full name from folder (often Author-ModName format)
      // or look up in allMods catalog
      let fullName = folder.includes('-') ? folder : undefined;
      
      if (!fullName && allMods) {
        const pack = allMods.find((p: any) => {
          const pName = String(p.name || '').toLowerCase();
          const pFullName = String(p.full_name || '').toLowerCase();
          const searchName = modName.toLowerCase();
          return pName === searchName || pFullName.endsWith(`-${searchName}`);
        });
        if (pack?.full_name) {
          fullName = pack.full_name;
        }
      }
      
      return {
        name: modName,
        fullName,
        version: m.version || undefined,
        enabled: true, // All mods in profile are enabled
      };
    }),
  };
}

/**
 * Encode a profile to a shareable string
 * Format: Compressed, chunked code for readability
 */
export function encodeProfileToShareCode(profile: ModProfile): string {
  try {
    // Create a minimal shareable version (exclude timestamps, id, and empty values)
    const shareData = {
      n: profile.name,
      ...(profile.description ? { d: profile.description } : {}),
      m: profile.mods.map(m => {
        const entry: Record<string, any> = { n: m.name };
        if (m.fullName) entry.f = m.fullName;
        if (m.version) entry.v = m.version;
        if (m.enabled) entry.e = 1;
        return entry;
      }),
    };
    const json = JSON.stringify(shareData);
    
    // Compress with pako (deflate)
    const compressed = pako.deflate(json, { level: 9 });
    
    // Convert to base64
    let base64 = btoa(String.fromCharCode(...compressed));
    
    // Make URL-safe
    base64 = base64.replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
    
    // Split into chunks of 8 for readability (balance between length and aesthetics)
    const chunks: string[] = [];
    for (let i = 0; i < base64.length; i += 8) {
      chunks.push(base64.slice(i, i + 8));
    }
    
    return `R5V-${chunks.join('-')}`;
  } catch (e) {
    console.error('Failed to encode profile:', e);
    return '';
  }
}

/**
 * Decode a share code back to a profile
 */
export function decodeShareCodeToProfile(code: string): ModProfile | null {
  try {
    if (!code.startsWith('R5V-')) {
      return null;
    }
    
    // Remove prefix and rejoin chunks
    let base64 = code.replace('R5V-', '').replace(/-/g, '');
    // Restore URL-safe characters (. back to +, _ back to /)
    base64 = base64.replace(/\./g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) base64 += '=';
    
    // Decode base64 to binary
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Decompress with pako
    const json = pako.inflate(bytes, { to: 'string' });
    const shareData = JSON.parse(json);
    
    const now = Date.now();
    return {
      id: generateProfileId(),
      name: shareData.n || 'Imported Profile',
      description: shareData.d || '',
      createdAt: now,
      updatedAt: now,
      mods: (shareData.m || []).map((m: any) => ({
        name: m.n || '',
        fullName: m.f || undefined,
        version: m.v || undefined,
        enabled: m.e === 1,
      })),
    };
  } catch (e) {
    console.error('Failed to decode profile code:', e);
    return null;
  }
}

/**
 * Upload a profile to Thunderstore and get a short share code
 */
export async function uploadProfileToThunderstore(profile: ModProfile): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  try {
    // Create profile data in r2modman compatible format
    const exportData = {
      profileName: profile.name,
      mods: profile.mods.map(m => ({
        name: m.fullName || m.name,
        version: {
          major: 0,
          minor: 0,
          patch: 0,
          ...(m.version ? parseVersionString(m.version) : {}),
        },
        enabled: m.enabled,
      })),
    };
    
    // Create the payload (r2modman format: #r2modman\n + base64 compressed data)
    const jsonData = JSON.stringify(exportData);
    const compressed = pako.deflate(jsonData, { level: 9 });
    const base64 = btoa(String.fromCharCode(...compressed));
    const payload = `#r2modman\n${base64}`;
    
    // Upload to Thunderstore
    const response = await fetch(THUNDERSTORE_PROFILE_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: payload,
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return { ok: false, error: 'Rate limited. Please wait and try again.' };
      }
      return { ok: false, error: `Server error: ${response.status}` };
    }
    
    const data = await response.json();
    return { ok: true, code: data.key };
  } catch (e) {
    console.error('Failed to upload profile:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Download a profile from Thunderstore using a share code
 */
export async function downloadProfileFromThunderstore(code: string): Promise<{ ok: true; profile: ModProfile } | { ok: false; error: string }> {
  try {
    const url = `${THUNDERSTORE_PROFILE_GET_URL}${encodeURIComponent(code)}/`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, error: 'Profile not found. The code may be expired or invalid.' };
      }
      if (response.status === 429) {
        return { ok: false, error: 'Rate limited. Please wait and try again.' };
      }
      return { ok: false, error: `Server error: ${response.status}` };
    }
    
    const text = await response.text();
    
    // Parse r2modman format: #r2modman\n + base64 data
    if (!text.startsWith('#r2modman\n')) {
      return { ok: false, error: 'Invalid profile format' };
    }
    
    const base64Data = text.replace('#r2modman\n', '');
    
    // Try to decode - could be compressed or raw
    let jsonData: string;
    try {
      // Try decompressing first
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      jsonData = pako.inflate(bytes, { to: 'string' });
    } catch {
      // Fall back to raw base64
      jsonData = atob(base64Data);
    }
    
    const exportData = JSON.parse(jsonData);
    
    // Convert to our profile format
    const now = Date.now();
    const profile: ModProfile = {
      id: generateProfileId(),
      name: exportData.profileName || 'Imported Profile',
      description: `Imported from Thunderstore code: ${code}`,
      createdAt: now,
      updatedAt: now,
      mods: (exportData.mods || []).map((m: any) => {
        const nameParts = String(m.name || '').split('-');
        const modName = nameParts.length > 1 ? nameParts.slice(1).join('-') : m.name;
        const version = m.version ? `${m.version.major || 0}.${m.version.minor || 0}.${m.version.patch || 0}` : undefined;
        return {
          name: modName,
          fullName: m.name,
          version: version !== '0.0.0' ? version : undefined,
          enabled: m.enabled !== false,
        };
      }),
    };
    
    return { ok: true, profile };
  } catch (e) {
    console.error('Failed to download profile:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Parse a version string like "1.2.3" into components
 */
function parseVersionString(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '0', 10) || 0,
    minor: parseInt(parts[1] || '0', 10) || 0,
    patch: parseInt(parts[2] || '0', 10) || 0,
  };
}

/**
 * Calculate what mods need to be installed/enabled for a profile
 */
export function calculateProfileDiff(
  profile: ModProfile,
  installedMods: any[]
): {
  toEnable: string[];
  toDisable: string[];
  toInstall: ModProfileEntry[];
  alreadyCorrect: string[];
} {
  // Create lookup maps for installed mods by name and folder
  const installedByName = new Map(
    installedMods.map(m => [String(m.name || m.id || '').toLowerCase(), m])
  );
  const installedByFolder = new Map(
    installedMods.filter(m => m.folder).map(m => [String(m.folder).toLowerCase(), m])
  );
  
  const toEnable: string[] = [];
  const toDisable: string[] = [];
  const toInstall: ModProfileEntry[] = [];
  const alreadyCorrect: string[] = [];
  const matchedInstalled = new Set<string>();
  
  // Check each mod in the profile
  for (const profileMod of profile.mods) {
    const nameKey = profileMod.name.toLowerCase();
    const fullNameKey = (profileMod.fullName || '').toLowerCase();
    
    // Try to find installed mod by: fullName -> folder -> name
    let installed = fullNameKey ? installedByFolder.get(fullNameKey) : undefined;
    if (!installed) installed = installedByFolder.get(nameKey);
    if (!installed) installed = installedByName.get(nameKey);
    
    if (!installed) {
      // Mod not installed
      if (profileMod.enabled) {
        toInstall.push(profileMod);
      }
    } else {
      // Track that we matched this installed mod
      matchedInstalled.add(String(installed.name || installed.id || '').toLowerCase());
      if (installed.folder) matchedInstalled.add(installed.folder.toLowerCase());
      
      // Mod is installed, check enabled state
      if (profileMod.enabled && !installed.enabled) {
        toEnable.push(installed.name || installed.id);
      } else if (!profileMod.enabled && installed.enabled) {
        toDisable.push(installed.name || installed.id);
      } else {
        alreadyCorrect.push(installed.name || installed.id);
      }
    }
  }
  
  // Check for mods that are installed but not in profile (should be disabled)
  for (const installed of installedMods) {
    const nameKey = String(installed.name || installed.id || '').toLowerCase();
    const folderKey = String(installed.folder || '').toLowerCase();
    
    if (!matchedInstalled.has(nameKey) && !matchedInstalled.has(folderKey)) {
      if (installed.enabled) {
        toDisable.push(installed.name || installed.id);
      }
    }
  }
  
  return { toEnable, toDisable, toInstall, alreadyCorrect };
}

// ============================================
// MOD UTILITIES
// ============================================

export function getModIconUrl(nameOrId?: string, allMods?: any[]): string | undefined {
  if (!nameOrId || !Array.isArray(allMods)) return undefined;
  const needle = String(nameOrId).toLowerCase();
  const pack = allMods.find((p: any) => {
    const name = String(p?.name || '').toLowerCase();
    const id = String(p?.id || '').toLowerCase();
    return name === needle || id === needle;
  });
  return pack?.icon_url;
}

export function getPackageUrlFromPack(pack: any): string | undefined {
  const url = pack?.package_url;
  if (typeof url === 'string' && url) return url;
  const versions = pack?.versions;
  if (Array.isArray(versions) && versions[0]?.download_url) return versions[0].download_url;
  return undefined;
}

export function getPackageUrlByName(name?: string, allMods?: any[]): string {
  const needle = String(name || '').toLowerCase();
  const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
  return getPackageUrlFromPack(pack) || '';
}

export function getLatestVersionForName(name?: string, allMods?: any[]): string | null {
  const needle = String(name || '').toLowerCase();
  const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
  const versions = pack?.versions;
  return (Array.isArray(versions) && versions[0]?.version_number) ? versions[0].version_number : null;
}

export function getPackByName(name?: string, allMods?: any[]): any | null {
  const needle = String(name || '').toLowerCase();
  const packs = (allMods || []);
  for (const pack of packs) {
    const packName = String(pack?.name || '').toLowerCase();
    if (packName === needle) return pack;
    const fullName = String(pack?.full_name || '').toLowerCase();
    if (fullName === needle) return pack;
    const versions = pack?.versions;
    if (Array.isArray(versions)) {
      for (const v of versions) {
        const vName = String(v?.name || '').toLowerCase();
        if (vName === needle) return pack;
      }
    }
  }
  return null;
}

export function isInstalledModVisible(mod: InstalledMod, allMods?: any[]): boolean {
  const pack = getPackByName(mod.name || mod.id, allMods);
  const isDeprecated = !!(pack && pack.is_deprecated);
  return !isDeprecated;
}
