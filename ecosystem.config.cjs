const path = require("path");

module.exports = {
  apps: [
    {
      name: "superknowledge-api",
      script: path.join(__dirname, "node_modules/.bin/tsx"),
      args: "apps/backend/server.ts",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 8001,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "superknowledge-worker",
      script: path.join(__dirname, "node_modules/.bin/tsx"),
      args: "apps/worker/worker.ts",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "superknowledge-web",
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      args: "start -p 3001",
      cwd: path.join(__dirname, "apps/web"),
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXT_PUBLIC_BACKEND_URL: "",
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
