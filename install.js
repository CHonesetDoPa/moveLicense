// install.js - Automatically executed during npm/pnpm install
const fs = require('fs');
const path = require('path');

// Detect if running under pnpm
const isPnpm = process.env.npm_config_user_agent?.includes('pnpm');

// Support both npm and pnpm environment variables
const targetProjectRoot = process.env.INIT_CWD || process.env.npm_config_init_cwd || process.cwd();
const packageJsonPath = path.join(targetProjectRoot, 'package.json');

// Use console.error for pnpm to ensure output visibility
const log = isPnpm ? console.error : console.log;

log('MoveLicense: Setting up automatic license file organization...');

if (!fs.existsSync(packageJsonPath)) {
  log('MoveLicense: No package.json found. Skipping setup.');
  log('   Run "npx movelicense" manually when needed.');
  process.exit(0);
}

try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  // Check if it's an Electron project
  const hasElectron =
    packageJson.dependencies?.electron ||
    packageJson.devDependencies?.electron ||
    packageJson.dependencies?.['electron-builder'] ||
    packageJson.devDependencies?.['electron-builder'];

  if (!hasElectron) {
    log('MoveLicense: Not an Electron project. Skipping setup.');
    process.exit(0);
  }

  // Check if already configured
  if (packageJson.build?.afterPack) {
    log('MoveLicense: afterPack already configured.');
    process.exit(0);
  }

  // Get the path to mv.js in node_modules
  let mvModulePath;
  try {
    // Try to get the absolute path to mv.js
    mvModulePath = require.resolve('movelicense/mv.js');
  } catch (e) {
    // Fallback to relative path from project root
    mvModulePath = path.join(targetProjectRoot, 'node_modules/movelicense/mv.js');
  }

  // Normalize path to use forward slashes for JSON compatibility
  mvModulePath = mvModulePath.replace(/\\/g, '/');

  // Update package.json
  packageJson.build = packageJson.build || {};
  packageJson.build.afterPack = mvModulePath;

  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    log('MoveLicense: Successfully configured!');
    log(`   - afterPack hook set to: ${mvModulePath}`);
    log('   - LICENSE files will be organized during build');
  } catch (writeError) {
    log('MoveLicense: Failed to write package.json: ' + writeError.message);
    throw writeError;
  }

} catch (error) {
  log('MoveLicense: Setup failed: ' + error.message);
}