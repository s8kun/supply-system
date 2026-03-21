import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../Supply_company_System_Backend/apiSchema.json",
    output: {
      mode: "single",
      target: "./lib/api/generated/client.ts",
      schemas: "./lib/api/generated/model",
      client: "fetch",
      clean: true,
      mock: false,
    },
  },
});
