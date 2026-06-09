module.exports = {
  apps: [
    {
      name: "oms",
      script: "npm",
      args: "start",
      cwd: "C:\\Users\\Administrator\\Documents\\OMS",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
