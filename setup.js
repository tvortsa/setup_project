import { parse } from "jsr:@std/toml@1.0.2";

async function setupProject(options) {
    console.log("- - - setupProject - - - ");
    
    const { force = false, dryRun = false } = options;
    const configText = await Deno.readTextFile("setup.toml");
    const config = parse(configText);

    for (const [baseFolder, subFolders] of Object.entries(config.folders)) {
        await createFolder(baseFolder, force, dryRun);
        for (const subFolder of subFolders) {
            await createFolder(`${baseFolder}/${subFolder}`, force, dryRun);
        }
    }

    for (const [filePath, content] of Object.entries(config.files || {})) {
        await createFile(filePath, content, force, dryRun);
    }
}

async function createFolder(path, force, dryRun) {
    try {
        if (dryRun) {
            console.log(`[DRY RUN] Would create folder: ${path}`);
        } else {
            await Deno.mkdir(path, { recursive: true });
            console.log(`Created folder: ${path}`);
        }
    } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists && !force) {
            console.warn(`Folder already exists: ${path}`);
        } else {
            console.error(`Error creating folder: ${path}`, error);
        }
    }
}

async function createFile(path, content, force, dryRun) {
    console.log("createFile");
    
    try {
        if (dryRun) {
            console.log(`[DRY RUN] Would create file: ${path}`);
        } else {
            await Deno.writeTextFile(path, content, { create: true });
            console.log(`Created file: ${path}`);
        }
    } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists && !force) {
            console.warn(`File already exists: ${path}`);
        } else {
            console.error(`Error creating file: ${path}`, error);
        }
    }
}

if (import.meta.main) {
    const args = Deno.args;
    const force = args.includes("--force");
    const dryRun = args.includes("--dry-run");
    
    await setupProject({ force, dryRun });
}
