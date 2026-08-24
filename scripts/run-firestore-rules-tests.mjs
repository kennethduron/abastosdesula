import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const firebaseCli = resolve("node_modules/firebase-tools/lib/bin/firebase.js");
const environment = { ...process.env };
delete environment.DEBUG;

const result = spawnSync(
  process.execPath,
  [
    firebaseCli,
    "emulators:exec",
    "--only",
    "firestore",
    "--project",
    "demo-abastosdesula",
    "node --test firebase/firestore.rules.test.mjs",
  ],
  {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
