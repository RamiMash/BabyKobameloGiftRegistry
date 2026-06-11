Baby Kobamelo Registry - Backend v2 Strict

This version fixes the reservation persistence issue by:
- using Netlify Functions written in ESM
- using Netlify Blobs with strong consistency
- preventing the old checkbox-only behavior from acting before the backend responds
- requiring guest name before saving
- locking a reserved gift across guests after the backend loads

Deployment:
1. Unzip this project.
2. Upload ALL files to GitHub.
3. In Netlify: Add new project > Import existing project > GitHub.
4. Build command: leave blank
5. Publish directory: .
6. Functions directory: netlify/functions
7. Deploy.

Test after deployment:
1. Visit: /.netlify/functions/get-reservations
   You should see JSON like: {"reservations":{}}
2. Reserve one gift on the live site.
3. Refresh the page.
4. Visit /.netlify/functions/get-reservations again.
   The gift should be listed there.
5. Open the site on another phone/browser.
   The reserved gift should be locked.

Important:
If you deploy with Netlify Drop only, backend functions may not work correctly. Use GitHub import.


Unreserve feature:
- When a guest reserves a gift, their browser receives a private local token.
- The backend stores that token with the reservation.
- Only the same browser/device will see the Unreserve button for that gift.
- Other guests only see the gift as reserved.
- If the guest changes device or clears browser data, they cannot unreserve themselves and should contact Hlake.
