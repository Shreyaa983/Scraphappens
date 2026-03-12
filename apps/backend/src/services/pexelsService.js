import { env } from "../config/env.js";

export async function fetchPexelsImage(query) {
  const apiKey = process.env.PEXELS_API_KEY || env.pexelsApiKey;
  if (!apiKey) {
    return null;
  }

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "3");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const first = data?.photos?.[0];
  return first?.src?.large || first?.src?.medium || null;
}


