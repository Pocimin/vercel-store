import { env } from "./env.js";
import { buildHttpServer } from "./http.js";

const app = await buildHttpServer();

await app.listen({
  host: env.API_HOST,
  port: env.API_PORT
});
