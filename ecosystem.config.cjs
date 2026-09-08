const path = require("path");

module.exports = {
  apps: [
    {
      name: "superknowledge-api",
      script: "apps/backend/server.ts",
      cwd: __dirname,
      interpreter: "node",
      node_args: "--import=tsx",
      env: {
        NODE_ENV: "production",
        PORT: 8001,
      },
      kill_timeout: 5000,
    },
    {
      name: "superknowledge-worker",
      script: "apps/worker/worker.ts",
      cwd: __dirname,
      interpreter: "node",
      node_args: "--import=tsx",
      env: {
        NODE_ENV: "production",
      },
      kill_timeout: 5000,
    },
    {
      name: "superknowledge-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: path.join(__dirname, "apps/web"),
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXT_PUBLIC_BACKEND_URL: "",
      },
      kill_timeout: 5000,
    },
  ],
};
