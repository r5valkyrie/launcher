import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { getAllSettings } from '../services/store.js';

/**
 * Fixes folder permissions for Windows
 */
async function handleFixFolderPermissions(_e, { selectedChannel }) {
  const errors = [];
  const folderPath = getAllSettings().channels[selectedChannel].installDir;
  
  try {
    if (!folderPath) {
      return { ok: false, error: 'No folder path provided' };
    }
    
    // Normalize the path for Windows commands
    const normalizedPath = path.resolve(folderPath).replace(/\//g, '\\');
    
    // Validate path format
    if (!normalizedPath || normalizedPath.length < 3) {
      return { ok: false, error: `Invalid path format: ${folderPath}` };
    }
    
    // Check if path contains invalid characters for Windows commands
    // Allow colon only in drive letter position (e.g., C:\)
    const pathWithoutDrive = normalizedPath.length >= 3 && normalizedPath[1] === ':' ? 
      normalizedPath.slice(3) : normalizedPath; // Skip "C:\" part
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(pathWithoutDrive)) {
      return { ok: false, error: `Path contains invalid characters: ${normalizedPath}` };
    }
    
    // Get current user
    const userInfo = os.userInfo();
    const username = userInfo.username;
    
    // Check if elevate.exe exists
    const elevateExePath = path.join(process.resourcesPath, 'elevate.exe');
    const useElevate = fs.existsSync(elevateExePath);
    
    // Ensure directory exists
    try {
      fs.mkdirSync(normalizedPath, { recursive: true });
    } catch (nodeCreateError) {
      // Directory creation may fail, but we'll continue with permission setting
    }
    
    const commands = [
      // Grant permissions using separate arguments instead of embedded quotes
      { 
        exe: 'icacls', 
        args: [normalizedPath, '/grant', `${username}:F`, '/t', '/q'], 
        desc: `Grant permissions to current user (${username})`
      },
      { 
        exe: 'icacls', 
        args: [normalizedPath, '/grant', 'Everyone:F', '/t', '/q'], 
        desc: 'Grant Everyone full permissions' 
      },
      { 
        exe: 'icacls', 
        args: [normalizedPath, '/grant', 'Users:F', '/t', '/q'], 
        desc: 'Grant Users full permissions' 
      },
    ];
    
    for (let i = 0; i < commands.length; i++) {
      const { exe, args, desc } = commands[i];
      try {
        
        const result = await new Promise((resolve, reject) => {
          // Use elevate.exe to run the command with admin privileges, or try without if not available
          let child;
          let spawnArgs;
          let spawnOptions;
          
          if (useElevate) {
            // With elevate.exe, we need to pass the exe and args through cmd /c
            spawnArgs = [elevateExePath, ['-wait', exe, ...args]];
            spawnOptions = { 
              stdio: ['ignore', 'pipe', 'pipe'],
              windowsHide: true
            };
          } else {
            // Without elevation, run the command directly
            spawnArgs = [exe, args];
            spawnOptions = { 
              stdio: ['ignore', 'pipe', 'pipe'],
              windowsHide: true
            };
          }
          
          
          try {
            child = spawn(spawnArgs[0], spawnArgs[1], spawnOptions);
          } catch (spawnError) {
            console.error(`[Permission Fix] Spawn failed:`, spawnError);
            reject(spawnError);
            return;
          }
          
          let stdout = '';
          let stderr = '';
          
          if (child.stdout) {
            child.stdout.on('data', (data) => {
              stdout += data.toString();
            });
          }
          
          if (child.stderr) {
            child.stderr.on('data', (data) => {
              stderr += data.toString();
            });
          }
          
          child.on('exit', (code, signal) => {
            resolve({ code, stdout, stderr, signal });
          });
          
          child.on('error', (err) => {
            reject(err);
          });
          
          // Set a timeout to prevent hanging
          setTimeout(() => {
            try {
              child.kill();
            } catch {}
            reject(new Error('Command timeout'));
          }, 30000);
        });
        
        if (result.code !== 0) {
          // Some commands are expected to fail (like duplicate permission grants), so be more lenient
          const errorOutput = result.stderr || result.stdout || 'Unknown error';
          const isMinorError = errorOutput.includes('duplicate') || 
                              errorOutput.includes('already') ||
                              result.code === 1332; // SID mapping error - try other formats
          
          if (!isMinorError) {
            const errorMsg = `${desc} failed (code ${result.code}): ${errorOutput}`;
            errors.push(errorMsg);
          }
        }
        
      } catch (error) {
        const errorMsg = `${desc} error: ${error.message}`;
        errors.push(errorMsg);
      }
    }
    
    // Verify the folder exists and is writable
    try {
      const testFile = path.join(normalizedPath, 'test_write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      const errorMsg = `Write test failed: ${error.message}`;
      errors.push(errorMsg);
      
      // Try a simple fallback approach
      try {
        fs.mkdirSync(normalizedPath, { recursive: true });
        
        const result = await new Promise((resolve) => {
          const child = spawn('cmd', ['/c', `icacls "${normalizedPath}" /grant "%USERNAME%":F /q`], { 
            stdio: 'ignore',
            windowsHide: true
          });
          child.on('exit', (code) => resolve({ code }));
          child.on('error', () => resolve({ code: 1 }));
          
          setTimeout(() => {
            try { child.kill(); } catch {}
            resolve({ code: 1 });
          }, 5000);
        });
        
        if (result.code === 0) {
          const testFile2 = path.join(normalizedPath, 'test_write2.tmp');
          fs.writeFileSync(testFile2, 'test');
          fs.unlinkSync(testFile2);
          return { ok: true, warnings: errors };
        }
      } catch (fallbackError) {
        // Fallback failed too
      }
      
      return { ok: false, error: errorMsg, details: errors };
    }
    
    if (errors.length > 0) {
      return { ok: true, warnings: errors };
    }
    
    return { ok: true };
    
  } catch (error) {
    const errorMsg = `Unexpected error: ${error?.message || error}`;
    errors.push(errorMsg);
    return { ok: false, error: errorMsg, details: errors };
  }
}

/**
 * Sets up permission-related IPC handlers
 */
export function setupPermissionsIPC(ipcMain) {
  ipcMain.handle('fix-folder-permissions', handleFixFolderPermissions);
}
