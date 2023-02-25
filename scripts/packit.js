const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const NAME = process.env.npm_package_name || "shady-grey-zone";
const VERSION = process.env.npm_package_version || new Date().getTime();

const outputFile = `${NAME}_${VERSION}.zip`;
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip');

output.on('close', () => console.log(`${archive.pointer()} total bytes written to ${outputFile}.`));
archive.on('error', err => { throw err });
archive.pipe(output);

// Create archive and copy module
archive.directory(path.resolve(__dirname, '../output'), 'shady-grey-zone');
archive.finalize();
fs.writeFileSync(path.resolve(__dirname, '../module.json'), fs.readFileSync(path.resolve(__dirname, '../output/module.json')));