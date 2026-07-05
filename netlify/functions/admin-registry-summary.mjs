import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { gifts } from "./gift-catalog.mjs";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
const adminPasswordHash = "e9bf0d9384a6503844567f634fb84c61c1d988df5df36680d8c43e800aecb9c2";

function money(value) {
  return Math.round(value * 100) / 100;
}

function reservationForGift(reservations, giftId) {
  const numericId = giftId.replace(/^gift-/, "");
  return reservations[giftId] || reservations[numericId] || null;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized." }), {
    status: 401,
    headers: jsonHeaders
  });
}

function isPasswordValid(submittedPassword) {
  const submittedHash = createHash("sha256").update(submittedPassword).digest();
  const expectedHash = Buffer.from(adminPasswordHash, "hex");

  return submittedHash.length === expectedHash.length && timingSafeEqual(submittedHash, expectedHash);
}

export default async (request) => {
  const submittedPassword = request.headers.get("x-admin-password") || "";

  if (!isPasswordValid(submittedPassword)) {
    return unauthorized();
  }

  try {
    const store = getStore({ name: "baby-kobamelo-registry", consistency: "strong" });
    const reservations = (await store.get("reservations", { type: "json", consistency: "strong" })) || {};

    const totalValue = gifts.reduce((sum, gift) => sum + gift.price, 0);
    const reservedValue = gifts.reduce((sum, gift) => {
      return sum + (reservationForGift(reservations, gift.id) ? gift.price : 0);
    }, 0);
    const unreservedValue = totalValue - reservedValue;

    const items = gifts.map((gift) => {
      const reservation = reservationForGift(reservations, gift.id);

      return {
        ...gift,
        reserved: Boolean(reservation),
        reservedAt: reservation?.reservedAt || null
      };
    });

    return new Response(JSON.stringify({
      totalValue: money(totalValue),
      reservedValue: money(reservedValue),
      unreservedValue: money(unreservedValue),
      totalGifts: gifts.length,
      reservedGifts: items.filter((gift) => gift.reserved).length,
      unreservedGifts: items.filter((gift) => !gift.reserved).length,
      items,
      updatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: jsonHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Could not load admin summary.",
      details: error.message
    }), {
      status: 500,
      headers: jsonHeaders
    });
  }
};
