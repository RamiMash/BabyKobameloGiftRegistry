import { getStore } from "@netlify/blobs";

function clean(value) {
  return String(value || "").trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const giftId = clean(body.giftId);
    const ownerToken = clean(body.ownerToken);

    if (!giftId || !ownerToken) {
      return new Response(JSON.stringify({ error: "Gift and owner token are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const store = getStore({ name: "baby-kobamelo-registry", consistency: "strong" });
    const reservations = (await store.get("reservations", { type: "json", consistency: "strong" })) || {};

    if (!reservations[giftId]) {
      return new Response(JSON.stringify({ success: true, removed: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    if (reservations[giftId].ownerToken !== ownerToken) {
      return new Response(JSON.stringify({ error: "You can only unreserve gifts reserved from this browser." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    delete reservations[giftId];
    await store.setJSON("reservations", reservations);

    return new Response(JSON.stringify({ success: true, removed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Could not remove reservation.",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
