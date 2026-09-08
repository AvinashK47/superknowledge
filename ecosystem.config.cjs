const path = require("path");

const TSX_CLI = path.join(__dirname, "node_modules/tsx/dist/cli.mjs");
const NEXT_BIN = path.join(__dirname, "apps/web/node_modules/next/dist/bin/next");

module.exports = {
  apps: [
    {
      name: "superknowledge-api",
      script: TSX_CLI,
      args: "apps/backend/server.ts",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 8001,
      },
      restart_delay: 2000,
      max_restarts: 10,
    },
    {
      name: "superknowledge-worker",
      script: TSX_CLI,
      args: "apps/worker/worker.ts",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 2000,
      max_restarts: 10,
    },
    {
      name: "superknowledge-web",
      script: NEXT_BIN,
      args: "start -p 3001",
      cwd: path.join(__dirname, "apps/web"),
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXT_PUBLIC_BACKEND_URL: "",
      },
      restart_delay: 2000,
      max_restarts: 10,
    },
  ],
};
