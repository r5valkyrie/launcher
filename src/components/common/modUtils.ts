// Mod-related utility functions

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
