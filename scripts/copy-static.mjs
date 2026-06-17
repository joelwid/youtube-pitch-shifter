import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await copyFile("public/manifest.json", "dist/manifest.json");
await cp("dist-ts/src", "dist/src", { recursive: true });
await copyFile("src/popup/popup.css", "dist/src/popup/popup.css");

const popup = await readFile("popup.html", "utf8");
await writeFile("dist/popup.html", popup.replace("/src/popup/popup.ts", "/src/popup/popup.js"));

const offscreen = await readFile("offscreen.html", "utf8");
await writeFile("dist/offscreen.html", offscreen.replace("/src/offscreen/offscreen.ts", "/src/offscreen/offscreen.js"));

await rm("dist-ts", { recursive: true, force: true });
