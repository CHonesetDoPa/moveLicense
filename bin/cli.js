#!/usr/bin/env node

// cli.js

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Read version from package.json
const packageJsonPath_self = path.join(__dirname, '..', 'package.json');
const packageJson_self = JSON.parse(fs.readFileSync(packageJsonPath_self, 'utf8'));
const version = packageJson_self.version;

program
  .version(version)
  .description('MoveLicense - Organize LICENSE files for Electron apps')
  .option('-f, --force', 'Force reconfiguration even if already setup')
  .option('--clean', 'Remove moveLicense configuration from project')
  .parse();

const options = program.opts();
const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');

if (options.clean) {
  cleanConfiguration();
} else {
  setupConfiguration(options.force);
}

function setupConfiguration(force = false) {
  console.log('MoveLicense: Setting up license file organization...');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: No package.json found in current directory.');
    console.log('   Please run this command from your project root directory.');
    process.exit(1);
  }

  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check Electron dependencies
    const hasElectron = packageJson.dependencies?.electron || 
                       packageJson.devDependencies?.electron ||
                       packageJson.dependencies?.['electron-builder'] ||
                       packageJson.devDependencies?.['electron-builder'];

    if (!hasElectron) {
      console.log('Warning: This doesn\'t appear to be an Electron project.');
      console.log('   MoveLicense is designed for Electron applications.');
    }

    // Check if already configured
    if (packageJson.build?.afterPack && !force) {
      console.log('MoveLicense: afterPack hook already configured.');
      console.log('   Use --force flag to reconfigure.');
      return;
    }

    // Get the path to mv.js in node_modules
    let mvModulePath;
    try {
      // Try to get the absolute path to mv.js
      mvModulePath = require.resolve('movelicense/mv.js');
    } catch (e) {
      // Fallback to relative path from project root
      mvModulePath = path.join(projectRoot, 'node_modules/movelicense/mv.js');
    }

    // Normalize path to use forward slashes for JSON compatibility
    mvModulePath = mvModulePath.replace(/\\/g, '/');

    // Update package.json
    packageJson.build = packageJson.build || {};
    packageJson.build.afterPack = mvModulePath;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log('MoveLicense: Successfully configured!');
    console.log(`   - afterPack hook set to: ${mvModulePath}`);
    console.log('   - LICENSE files will be organized during build');

  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

function cleanConfiguration() {
  console.log('MoveLicense: Cleaning up configuration...');

  try {
    if (fs.existsSync(packageJsonPath)) {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Remove afterPack configuration
      if (packageJson.build?.afterPack) {
        delete packageJson.build.afterPack;
        
        // If build object is empty, delete it too
        if (Object.keys(packageJson.build).length === 0) {
          delete packageJson.build;
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('Removed afterPack configuration from package.json');
      }
    }

    console.log('MoveLicense: Configuration cleaned up successfully!');

  } catch (error) {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  }
}