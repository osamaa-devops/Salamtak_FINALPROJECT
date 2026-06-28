import { spawn } from "child_process";

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error("Unable to locate the npm CLI");
}

const runNpm = (args) => spawn(process.execPath, [npmCli, ...args], { stdio: "inherit" });

const processes = [
  runNpm(["run", "backend:dev"]),
  runNpm(["run", "frontend:dev", "--", "--host", "0.0.0.0"]),
];

let isShuttingDown = false;

function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  processes.forEach((child) => {
    if (!child.killed) child.kill("SIGINT");
  });
  setTimeout(() => process.exit(code), 250);
}

processes.forEach((child) => {
  child.on("exit", (code, signal) => {
    if (!isShuttingDown && code && code !== 0) {
      console.error(`Dev process exited with ${signal || code}`);
      shutdown(code);
    }
  });
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
