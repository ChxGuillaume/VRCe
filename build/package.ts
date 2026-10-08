// Packages the production build for the Chrome Web Store, as artifacts/vrce-<version>.zip.
// Run through `npm run package`, which builds first.
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {zipSync, type Zippable} from 'fflate';

interface Manifest {
    manifest_version: number;
    name: string;
    description: string;
    version: string;
    icons?: Record<string, string>;
    host_permissions?: string[];
}

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const artifacts = join(root, 'artifacts');

function listFiles(dir: string): string[] {
    return readdirSync(dir).flatMap(name => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
}

if (!existsSync(join(dist, 'manifest.json'))) {
    console.error('No build found in dist/, run `npm run package`.');
    process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf-8')) as Manifest;
const files = listFiles(dist);

// The Chrome Web Store rejects or flags these, catch them before uploading.
const problems: string[] = [];

if (manifest.manifest_version !== 3) problems.push('manifest_version must be 3.');
if (manifest.name.length > 75) problems.push(`name is ${manifest.name.length} characters, the limit is 75.`);
if (manifest.description.length > 132) problems.push(`description is ${manifest.description.length} characters, the limit is 132.`);
if (!manifest.icons?.['128'] || !existsSync(join(dist, manifest.icons['128']))) problems.push('a 128px icon is required.');
if (manifest.host_permissions?.some(permission => permission.includes('127.0.0.1')))
    problems.push('the dev auto reload permission is present, this is a `npm run serve` build.');
if (files.some(file => file.endsWith('.map'))) problems.push('source maps are present, this is a development build.');

if (problems.length) {
    console.error(`Can't package dist/:\n${problems.map(problem => `  - ${problem}`).join('\n')}`);
    process.exit(1);
}

const zippable: Zippable = {};
files.forEach(file => zippable[relative(dist, file).split(sep).join('/')] = readFileSync(file));

const zip = zipSync(zippable, {level: 9});
const output = join(artifacts, `vrce-${manifest.version}.zip`);

mkdirSync(artifacts, {recursive: true});
writeFileSync(output, zip);

console.log(`Packaged ${files.length} files into ${relative(root, output)} (${(zip.length / 1024).toFixed(0)} KB).`);
