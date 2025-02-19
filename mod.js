import { ensureConfigFile } from './src/config.js';
import { setupProject } from './src/setup.js';
import { removeProjectStructure } from './src/remove.js';
import { displayProjectInfo } from './src/info.js';
import { displayModuleVersion, showMenuAndGetChoice } from './src/utils.js';
import { green } from 'jsr:@std/fmt/colors';

async function main() {
  await ensureConfigFile();

  let continueRunning = true;
  while (continueRunning) {
    const choice = await showMenuAndGetChoice();

    switch (choice) {
      case '1':
        await setupProject({ force: false, dryRun: false });
        break;
      case '2':
        await removeProjectStructure({ dryRun: false, force: false });
        break;
      case '3':
        await displayProjectInfo();
        break;
      case '4':
        await displayModuleVersion();
        break;
      case '0':
        console.log(green('Выход из программы.'));
        continueRunning = false;
        break;
    }
  }
}

if (import.meta.main) {
  await main();
}
