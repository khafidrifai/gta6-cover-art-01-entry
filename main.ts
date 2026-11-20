// Hands in the Vice City Cover Maker (Node 22, standard library only).
//
// The entry is the app/ folder beside this file — plain static files a
// desktop browser opens offline — plus screenshots/ of the app at work. This
// program copies both into /output and writes /output/dossier.json, the
// summary the judge reads, using the vendored make.fun library. The library
// reads the copied files and shapes the dossier, so the dossier always
// describes exactly what was handed in.
//
// Run it locally with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps the scorer enforces: at most 4 screenshots of 256 KiB each, an
// app/ of at most 993 files and 48 MiB with no path over 1000 bytes, and a
// dossier text of at most 163,840 bytes. buildDossier refuses an entry that
// breaks them, so a dossier that exists passed them.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
