# Third Wave Cafe: QR Table Ordering (Hackathon Plan)

## 1. Goal
Customers scan a QR code on their table, which already carries the table number. The cafe menu opens, they customise items, and place an order. Staff see the order live, mark it prepared, then served, and it leaves the live view.

**Constraints from the brief:** Next.js, Tailwind, an aesthetic cafe theme, a clean admin panel, no tests, no linting, quick hackathon build, deploy on Google Cloud.

## 2. Questions asked before building

| # | Question | Options offered | Answer |
|---|----------|-----------------|--------|
| 1 | Where should orders and menu data be stored? | Firestore, in-memory, SQLite file | **`.json` file** |
| 2 | How should the admin and waiter panels work? | Two routes with two logins, one login with two tabs, waiter panel only | **One login, two tabs** |
| 3 | Should the flow include payment, and which currency? | No payment (₹), no payment ($), online payment | **No payment for now**, maybe later if time permits (currency not specified) |
| 4 | What does the customer see after ordering, and what happens when an order is served? | Live status page, simple confirmation, live status then delete | **Simple confirmation** |

## 3. Decisions made without an explicit answer
These were not covered by the answers above, so they are flagged for review.

- **Currency:** ₹ (INR). It is one constant in `lib/brand.js`.
- **Served orders:** kept in a History tab in the staff panel, not deleted. They only leave the live view.
- **Menu content and prices:** invented by me as typical cafe items. Editable from the Menu tab or `data/menu.json`.
- **Add-on prices:** oat and almond milk +₹50, soy milk +₹40, extra shot +₹40. These are placeholders.
- **Extra staff tabs:** QR Codes (printable codes per table) and the sold-out toggle, both needed for the QR flow.
- **Live updates:** the staff screen polls every 4 seconds and beeps on new orders. Polling was chosen because storage is a JSON file.
- **Missing table number:** if `/menu` is opened without a table number, the app asks the customer to scan the table QR.

## 4. Features

### Customer (`/menu?table=N`)
- Cafe-themed menu with four categories: Hot Beverages, Cold Beverages, Snacks & Mains, Desserts.
- Tapping an item opens a customiser:
  - **Beverages:** size (small, medium, large, each with its own price), sugar level, milk type, extra shot, quantity, special request.
  - **Food:** quantity and special request, with veg and non-veg markers.
- Cart, order total and place order, then a confirmation screen showing the order number.
- The server recalculates prices from the menu, so the client cannot tamper with them.

### Staff panel (`/admin`, one login)
- **Live Orders:** a "To prepare" column and a "Ready to serve" column. Actions are *Mark prepared*, then *Served to customer*, and the order leaves the live view.
- **Menu:** edit prices, mark items sold out, add or delete items.
- **QR Codes:** generate and print a QR per table (the table count is configurable).
- **History:** served orders and total sales.

## 5. Tech stack and structure
- Next.js 14 (App Router), React 18, Tailwind CSS 3, `qrcode` library.
- Storage: JSON files, `data/menu.json` and `data/orders.json`. `DATA_DIR` env var sets the location.
- Auth: cookie-based login with an httpOnly cookie. Credentials come from env vars.

```
app/menu/page.js          customer menu, customiser, cart
app/order-placed/page.js  confirmation screen
app/admin/page.js         login + Live Orders / Menu / QR Codes / History
app/api/menu              GET menu, PUT menu (auth)
app/api/orders            POST place order, GET list (auth)
app/api/orders/[id]       PATCH status (auth)
app/api/auth              login, logout, session check
lib/                      db, auth, brand and config
data/                     menu.json and orders.json
```

## 6. Order lifecycle
`new` → `prepared` → `served`. Served orders disappear from Live Orders but stay in History.

## 7. Deployment (Google Cloud Run)
```
gcloud run deploy cafe --source . --allow-unauthenticated \
  --min-instances 1 --max-instances 1 \
  --set-env-vars ADMIN_USER=...,ADMIN_PASS=...,AUTH_SECRET=...
```
Then open `/admin`, go to QR Codes, and print the codes from the **deployed URL**.

Default credentials are `admin` / `thirdwave123`. Change them with the env vars before going live.

## 8. Known limitations (hackathon trade-offs)
- JSON storage on Cloud Run is **ephemeral**: data is lost on restart or redeploy. Pinning to one instance keeps the data consistent while it runs.
- Polling instead of real-time push.
- No payment, no customer order-status tracking, no tests or linting by design.

## 9. Future work
- Online payment (Razorpay or Stripe).
- Firestore for persistent, real-time storage.
- Separate waiter and admin logins.
- Live order-status page for customers.
