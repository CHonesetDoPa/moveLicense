// mv.js
// This file is used to move the LICENSE files to the root of the app directory.

const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const fsExtra = require('fs-extra');

/**
 * moveLicense hook
 * @param {object} context - electron-builder hook context
 * @param {object} [options] - optional settings: { strict: boolean }
 */
module.exports = async (context, options = {}) => {
  const log = (...args) => console.log('[moveLicense]', ...args);
  const error = (...args) => console.error('[moveLicense]', ...args);

  // Basic validation
  if (!context || typeof context !== 'object') {
    throw new Error('Missing context argument');
  }

  const { appOutDir, electronPlatformName, packager } = context;
  const strict = options.strict || (context.moveLicenseOptions && context.moveLicenseOptions.strict) || false;

  if (!appOutDir) throw new Error('context.appOutDir is required');
  if (!electronPlatformName) throw new Error('context.electronPlatformName is required');
  if (!packager || !packager.projectDir) throw new Error('context.packager.projectDir is required');

  const projectDir = packager.projectDir;

  // Determine unpacked dir (kept simple for compatibility with original behavior)
  let unpackedDir;
  switch (electronPlatformName) {
    case 'win32':
    case 'linux':
    case 'darwin':
      unpackedDir = path.resolve(appOutDir);
      break;
    default:
      throw new Error(`Unsupported platform: ${electronPlatformName}`);
  }

  const licenseDir = path.join(unpackedDir, 'license');
  await fsExtra.ensureDir(licenseDir);

  // Cache native cp availability
  const hasNativeCp = typeof fsp.cp === 'function';
  log('using', hasNativeCp ? 'native fs.promises.cp' : 'fs-extra.copy');

  const exists = async (p) => {
    try {
      return await fsExtra.pathExists(p);
    } catch (e) {
      return false;
    }
  };

  const moveIfExists = async (src, dest) => {
    try {
      if (await exists(src)) {
        await fsExtra.move(src, dest, { overwrite: true });
        log('Moved', src, '->', dest);
        return { ok: true };
      } else {
        log('Skipped missing file', src);
        return { ok: false, skipped: true };
      }
    } catch (err) {
      error('Error moving', src, '->', dest, err);
      return { ok: false, error: err };
    }
  };

  const copyIfExists = async (src, dest, opts = {}) => {
    try {
      if (!(await exists(src))) {
        log('Skipped missing file/dir', src);
        return { ok: false, skipped: true };
      }

      if (hasNativeCp) {
        // Node's native cp supports recursive copy
        await fsp.cp(src, dest, { recursive: true, force: true });
      } else {
        await fsExtra.copy(src, dest, { overwrite: true, dereference: true });
      }
      log('Copied', src, '->', dest);
      return { ok: true };
    } catch (err) {
      error('Error copying', src, '->', dest, err);
      return { ok: false, error: err };
    }
  };

  // Move Electron and Chromium license files in parallel
  const moves = await Promise.allSettled([
    moveIfExists(path.join(unpackedDir, 'LICENSE.electron.txt'), path.join(licenseDir, 'LICENSE.electron.txt')),
    moveIfExists(path.join(unpackedDir, 'LICENSES.chromium.html'), path.join(licenseDir, 'LICENSES.chromium.html')),
  ]);

  // Copy custom project license files (search up to two levels deep)
  // This will scan projectDir and its subdirectories up to depth 2 (projectDir: depth 0)
  const copyAllLicenseFiles = async () => {
    const results = [];
    const maxDepth = 2;

    // Match a broad set of possible license/notice filenames (case-insensitive)
    const nameRegex = /^(license|licence|licenses|licences|copying|notice|eula|terms|legal)([-._A-Za-z0-9]*)?(\.(txt|md|rst))?$/i;

    // Recursively scan directories up to maxDepth
    const scanDir = async (dir, depth) => {
      if (depth > maxDepth) return;

      let entries;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch (e) {
        // ignore missing dirs or permission errors at this stage
        return;
      }

      for (const dirent of entries) {
        const name = dirent.name;
        const full = path.join(dir, name);

        // If the name matches our license patterns, copy it into licenseDir preserving relative path
        if (nameRegex.test(name)) {
          const rel = path.relative(projectDir, full);
          const dest = path.join(licenseDir, rel);

          try {
            // ensure destination parent exists
            await fsExtra.ensureDir(path.dirname(dest));
            results.push(await copyIfExists(full, dest));
          } catch (e) {
            error('Failed to prepare/copy', full, '->', dest, e);
            results.push({ ok: false, error: e });
          }
        }

        // If it's a directory, continue scanning (unless we've reached max depth)
        if (dirent.isDirectory()) {
          await scanDir(full, depth + 1);
        }
      }
    };

    // Start scanning from project root
    await scanDir(projectDir, 0);

    // Additionally, if package.json has a license string, create a small file recording it
    try {
      const pkgPath = path.join(projectDir, 'package.json');
      if (await exists(pkgPath)) {
        const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
        if (pkg && pkg.license) {
          const out = path.join(licenseDir, 'LICENSE.package.json.txt');
          await fsp.writeFile(out, `package.json license: ${pkg.license}\n`, 'utf8');
          log('Wrote package.json license to', out);
          results.push({ ok: true });
        }
      }
    } catch (e) {
      // non-fatal
      error('Failed to read package.json for license field:', e);
      results.push({ ok: false, error: e });
    }

    return results;
  };

  const copyResults = await copyAllLicenseFiles();

  // Summarize
  const summary = {
    moved: moves.filter(r => r.status === 'fulfilled' && r.value && r.value.ok).length,
    movedSkipped: moves.filter(r => r.status === 'fulfilled' && r.value && r.value.skipped).length,
    movedFailed: moves.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value && (r.value.error || !r.value.ok))).length,
    copied: copyResults.filter(r => r && r.ok).length,
    copiedFailed: copyResults.filter(r => r && r.error).length,
  };

  log('Summary:', summary);

  // If strict, throw on any failures
  if (strict && (summary.movedFailed > 0 || summary.copiedFailed > 0)) {
    throw new Error('moveLicense encountered errors and strict mode is enabled');
  }
};