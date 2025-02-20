import { ensureConfigFile } from './src/config.js';
import { setupProject } from './src/setup.js';
import { removeProjectStructure } from './src/remove.js';
import { displayProjectInfo } from './src/info.js';
import { displayModuleVersion, showMenuAndGetChoice } from './src/utils.js';
import grabStructure from "./src/grab_struct.js"; "./src/grab_struct.js";
import { runMenu } from "./src/menu.js";
import {green} from '@std/fmt/colors';

async function main() {
  await ensureConfigFile();

  let continueRunning = true;
  while (continueRunning) {
    // const choice = await showMenuAndGetChoice();
    const choice = await runMenu();

    switch (choice) {
      case '1':
        await setupProject({ force: false, dryRun: false });
        break;
      case '2':
        await grabStructure();
        break;
      case '3':
        await removeProjectStructure({ dryRun: false, force: false });
        break;
      case '4':
        await displayProjectInfo();
        break;
      case '5': 
        await displayModuleVersion();
        break
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
