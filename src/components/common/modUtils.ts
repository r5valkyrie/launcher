// Mod-related utility functions

type InstalledMod = {
  id?: string;
  name: string;
  enabled: boolean;
  version?: string;
};

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
