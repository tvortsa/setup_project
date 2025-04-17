import { ensure_config_file } from "./src/config.js";
import { setup_project } from "./src/setup.js";
import { remove_project_structure } from "./src/remove.js";
import { display_project_info } from "./src/info.js";
import { display_module_version } from "./src/utils.js";
import grab_structure from "./src/grab_struct.js";
import { runMenu } from "./src/menu.js";
import { green } from "@std/fmt/colors";
import { update_code } from "./src/update_code.js";
import combine_files from "./src/combine_files.js";
import { generate_project_from_template } from "./src/generate_template.js";

async function main() {
  await ensure_config_file();

  let continueRunning = true;
  while (continueRunning) {
    // const choice = await showMenuAndGetChoice();
    const choice = await runMenu();

    switch (choice) {
      case "1":
        await setup_project({ force: false, dryRun: false });
        break;
      case "2":
        await grab_structure();
        break;
      case "3":
        await remove_project_structure({ dryRun: false, force: false });
        break;
      case "4":
        await display_project_info();
        break;
      case "5":
        await display_module_version();
        break;
      case "6":
        await update_code();
        break;
      case "7":
        await combine_files("combined_code.txt", ".");
        break;
      case "8":
        await generate_project_from_template();
        break;
      case "0":
        console.log(green("Выход из программы."));
        continueRunning = false;
        break;
    }
  }
}

if (import.meta.main) {
  await main();
}
