import { env, validateEnv } from "../config/env.js";
import { seedDiyInspirationPosts } from "../db/diySeeds.js";

async function main() {
  validateEnv();

  if (!env.pexelsApiKey) {
    throw new Error("Missing PEXELS_API_KEY");
  }

  const result = await seedDiyInspirationPosts();
  console.log("DIY image refresh completed.", result);
}

main().catch((error) => {
  console.error("DIY image refresh failed:", error.message);
  process.exit(1);
});
