import { copyFile, mkdir } from "node:fs/promises";

const outputDirectory = new URL("../public/icons/", import.meta.url);
const icons = [
  ["icon-512.png", "../montra-images/icon-512.png"],
  ["apple-touch-icon.png", "../montra-images/icon-180.png"],
  ["favicon.png", "../montra-images/icon-32.png"],
];

await mkdir(outputDirectory, { recursive: true });
for (const [filename, source] of icons) {
  await copyFile(new URL(source, import.meta.url), new URL(filename, outputDirectory));
  console.log(`Installed Montra asset ${filename}`);
}