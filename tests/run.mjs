// Runs the API suite against a production build:
//   npm run build && npm test
// Starts the Supabase mock and `next start`, runs tests/api.test.mjs, stops both.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MOCK_PORT = process.env.MOCK_PORT ?? "5199";
const APP_PORT = process.env.APP_PORT ?? "5499";

const env = {
  ...process.env,
  MOCK_PORT,
  MOCK_NO_CMS: "1",
  SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  ADMIN_PASSWORD: "test-owner-password-1!",
  CRON_SECRET: "test-cron-secret",
  // Never reach real services from tests.
  RESEND_API_KEY: "",
  TURNSTILE_SECRET_KEY: "",
  GITHUB_REPOS: "",
  FORM_ENDPOINT: "",
  ALERT_EMAIL_TO: "",
};

const children = [];
const start = (cmd, args) => {
  // Own process group, so stopping it also stops what npx started.
  const child = spawn(cmd, args, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
  child.stderr.on("data", (d) => process.env.VERBOSE && process.stderr.write(d));
  children.push(child);
  return child;
};
const stop = () =>
  children.forEach((c) => {
    try {
      process.kill(-c.pid, "SIGTERM");
    } catch {}
  });
process.on("exit", stop);

/** Refuse to test against something already listening on the port. */
async function free(port) {
  try {
    await fetch(`http://localhost:${port}/`);
  } catch {
    return;
  }
  console.error(`Port ${port} is already in use. Stop that process or set APP_PORT / MOCK_PORT.`);
  process.exit(1);
}
await free(MOCK_PORT);
await free(APP_PORT);

async function waitFor(url, ms = 30_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`${url} did not come up`);
}

start("node", ["tests/mock-supabase.mjs"]);
start("npx", ["next", "start", "-p", APP_PORT]);
await waitFor(`http://localhost:${MOCK_PORT}/__mock/state`);
await waitFor(`http://localhost:${APP_PORT}/robots.txt`, 60_000);

process.env.APP = `http://localhost:${APP_PORT}`;
process.env.MOCK = `http://localhost:${MOCK_PORT}`;
process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD;
process.env.CRON_SECRET = env.CRON_SECRET;
let failed = 1;
try {
  ({ failed } = await import("./api.test.mjs"));
} finally {
  stop();
}
process.exit(failed ? 1 : 0);
