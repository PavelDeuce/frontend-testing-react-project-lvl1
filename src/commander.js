import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

import loadPage from './index.js';

const packageContent = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
const { version } = JSON.parse(packageContent);

const program = new Command();

export default () => {
  const outputOption = '-o --output [path]';
  return program
    .version(version)
    .description('Download the webpage by url')
    .arguments('<url>')
    .option(outputOption, 'output directory', process.cwd())
    .action((url, argv) => {
      console.log(`Downloading ${url}...`);
      loadPage(url, argv.output)
        .then(({ filepath }) => console.log(`Page loaded to ${filepath}`))
        .catch((err) => {
          console.error(err.message);
          process.exit(1);
        });
    })
    .parse(process.argv);
};
