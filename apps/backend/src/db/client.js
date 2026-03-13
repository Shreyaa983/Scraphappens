import { neon } from "@neondatabase/serverless";
import { env } from "../config/env.js";

let cachedClient = null;

function getClient() {
	if (!env.databaseUrl) {
		throw new Error("NEON_DATABASE_URL is not configured");
	}

	if (!cachedClient) {
		cachedClient = neon(env.databaseUrl);
	}

	return cachedClient;
}

export function sql(strings, ...values) {
	return getClient()(strings, ...values);
}
