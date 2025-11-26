// scripts/package.js
import { createWriteStream } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createPackage() {
  const output = createWriteStream(join(__dirname, "../bundle.zip"));
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  output.on("close", () => {
    console.log("Package created successfully");
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  // Aggiungi i file necessari per il deployment
  archive.directory(".next/standalone/", "standalone");
  archive.directory(".next/static/", "standalone/.next/static");
  archive.directory("public/", "standalone/public");

  await archive.finalize();
}

createPackage();
