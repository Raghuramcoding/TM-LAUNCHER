const { MSICreator } = require('electron-wix-msi');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function findWixTool(toolName) {
  const candidates = [
    process.env.WIX_PATH,
    process.env.WIX
  ].filter(Boolean).map(directory => path.join(directory, 'bin', toolName));
  candidates.push(
    'C:\\Program Files (x86)\\WiX Toolset v3.14\\bin\\' + toolName,
    'C:\\Program Files (x86)\\WiX Toolset v3.11\\bin\\' + toolName,
    'C:\\Program Files\\WiX Toolset v3.14\\bin\\' + toolName
  );
  return candidates.find(candidate => fs.existsSync(candidate));
}

async function buildMsi() {
  const projectRoot = __dirname;
  const candle = findWixTool('candle.exe');
  const light = findWixTool('light.exe');
  if (!candle || !light) {
    throw new Error('WiX Toolset is required. Run `choco install wixtoolset -y` from an Administrator PowerShell, then run `npm run dist:msi` again.');
  }
  process.env.PATH = `${path.dirname(candle)};${process.env.PATH}`;
  const msiCreator = new MSICreator({
    appDirectory: path.join(projectRoot, 'dist', 'win-unpacked'),
    description: 'A focused desktop launcher for Trackmania games.',
    exe: 'TMLauncher',
    name: 'TMLauncher',
    manufacturer: 'TMLauncher',
    version: '0.1.0',
    outputDirectory: path.join(projectRoot, 'dist')
  });
  await msiCreator.create();
  const wixSource = path.join(projectRoot, 'dist', 'TMLauncher.wxs');
  const wixObject = path.join(projectRoot, 'dist', 'TMLauncher.wixobj');
  const msiFile = path.join(projectRoot, 'dist', 'TMLauncher.msi');
  const candleResult = spawnSync(candle, ['-ext', 'WixUtilExtension', '-ext', 'WixUIExtension', wixSource], { cwd: path.dirname(wixSource), encoding: 'utf8' });
  if (candleResult.status !== 0) throw new Error(candleResult.stderr || candleResult.stdout || 'WiX candle.exe failed.');
  const lightResult = spawnSync(light, ['-ext', 'WixUtilExtension', '-ext', 'WixUIExtension', '-out', msiFile, wixObject], { cwd: path.dirname(wixSource), encoding: 'utf8' });
  if (lightResult.status !== 0) throw new Error(lightResult.stderr || lightResult.stdout || 'WiX light.exe failed.');
  console.log(`Created ${msiFile}`);
}

buildMsi().catch(error => { console.error(error); process.exitCode = 1; });
