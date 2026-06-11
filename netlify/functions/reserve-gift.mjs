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
    const giftName = clean(body.giftName);
    const guestName = clean(body.guestName);
    const note = clean(body.note);
    const ownerToken = clean(body.ownerToken);

    if (!giftId || !giftName || !guestName || !ownerToken) {
      return new Response(JSON.stringify({ error: "Gift and guest name are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const store = getStore({ name: "baby-kobamelo-registry", consistency: "strong" });
    const reservations = (await store.get("reservations", { type: "json", consistency: "strong" })) || {};

    if (reservations[giftId]) {
      return new Response(JSON.stringify({
        error: "This gift is already reserved.",
        reservation: reservations[giftId]
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const reservation = {
      giftId,
      giftName,
      guestName,
      note,
      ownerToken,
      reservedAt: new Date().toISOString()
    };

    reservations[giftId] = reservation;
    await store.setJSON("reservations", reservations);

    return new Response(JSON.stringify({ success: true, reservation }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Could not save reservation.",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
