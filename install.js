// install.js - Automatically executed during npm install
const fs = require('fs');
const path = require('path');

// Get the target project root directory (not the current package directory)
const targetProjectRoot = process.env.INIT_CWD || process.cwd();
const packageJsonPath = path.join(targetProjectRoot, 'package.json');

console.log('MoveLicense: Setting up automatic license file organization...');

// Check if in project root directory (package.json exists)
if (!fs.existsSync(packageJsonPath)) {
  console.log('MoveLicense: No package.json found in target directory. Skipping auto-setup.');
  console.log('   You can manually run "npx movelicense" when needed.');
  return;
}

try {
  // Read target project's package.json
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  // Check if it's an Electron project
  const hasElectron = packageJson.dependencies?.electron || 
                     packageJson.devDependencies?.electron ||
                     packageJson.dependencies?.['electron-builder'] ||
                     packageJson.devDependencies?.['electron-builder'];

  if (!hasElectron) {
    console.log('MoveLicense: This doesn\'t appear to be an Electron project. Skipping auto-setup.');
    console.log('   Install electron or electron-builder first, then run "npx movelicense" to setup.');
    return;
  }

  // Check if already configured
  if (packageJson.build?.afterPack) {
    console.log('MoveLicense: afterPack hook already configured. Skipping auto-setup.');
    console.log('   Run "npx movelicense --force" to reconfigure if needed.');
    return;
  }

  // Copy moveLicense script to target project
  const moveLicenseSource = path.join(__dirname, 'mv.js');
  const moveLicenseTarget = path.join(targetProjectRoot, 'moveLicense.js');

  // Check if source file exists
  if (!fs.existsSync(moveLicenseSource)) {
    console.error('MoveLicense: Source file mv.js not found. Installation may be corrupted.');
    return;
  }

  // Check if target already exists
  if (fs.existsSync(moveLicenseTarget)) {
    console.log('MoveLicense: moveLicense.js already exists in target directory.');
    console.log('   Run "npx movelicense --force" to overwrite if needed.');
    return;
  }

  fs.copyFileSync(moveLicenseSource, moveLicenseTarget);

  // Update package.json
  packageJson.build = packageJson.build || {};
  packageJson.build.afterPack = './moveLicense.js';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('MoveLicense: Successfully configured!');
  console.log('   - Added afterPack hook to package.json');
  console.log('   - Copied moveLicense.js to your project root');
  console.log('   - LICENSE files will be automatically organized after each build');
  
} catch (error) {
  console.error('MoveLicense: Setup failed:', error.message);
  console.log('   You can manually run "npx movelicense" to setup later.');
}