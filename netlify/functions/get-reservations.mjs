import { getStore } from "@netlify/blobs";

export default async () => {
  try {
    const store = getStore({ name: "baby-kobamelo-registry", consistency: "strong" });
    const reservations = (await store.get("reservations", { type: "json", consistency: "strong" })) || {};

    return new Response(JSON.stringify({ reservations }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Could not load reservations.",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
