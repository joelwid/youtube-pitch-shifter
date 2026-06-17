import { copyFile, mkdir, readFile, writeFile, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/src/popup", { recursive: true });
await mkdir("dist/src/offscreen", { recursive: true });

await copyFile("public/manifest.json", "dist/manifest.json");
await copyFile("dist-ts/src/background/background.js", "dist/background.js");
await copyFile("dist-ts/src/popup/popup.js", "dist/src/popup/popup.js");
await copyFile("dist-ts/src/offscreen/offscreen.js", "dist/src/offscreen/offscreen.js");

const popup = await readFile("popup.html", "utf8");
await writeFile("dist/popup.html", popup.replace("/src/popup/popup.ts", "/src/popup/popup.js"));

const offscreen = await readFile("offscreen.html", "utf8");
await writeFile("dist/offscreen.html", offscreen.replace("/src/offscreen/offscreen.ts", "/src/offscreen/offscreen.js"));

await rm("dist-ts", { recursive: true, force: true });
