# SarkinMota — MVP Product & System Spec

Status: **v0.5, building.** We build a working product first and refine as we go.

---

## 1. What this app is

**SarkinMota's own store in your pocket.** You see what SarkinMota has, buy it, and they deliver it to you. No trip to the showroom.

- **Not a marketplace.** Only SarkinMota lists cars. Customers browse and buy.
- SarkinMota Autos: luxury dealership, showroom in the Central Business District, Abuja. Stock spans **Executive Class, Sport & Performance, Premium SUVs, Electric Vehicles, Power Bikes, Executive Buses**, and often includes cars that are genuinely rare ("only 2 in the country"). Customs specialists are in-house. ([sarkinmota.ng](https://www.sarkinmota.ng/))
- Ways to pay: **outright**, or **40% now, the balance later** (terms to be confirmed).
- **Design:** Apple-grade polish, meaning dark, cinematic imagery, big confident type and glass surfaces, in SarkinMota black and gold. The Apple TV recording is **inspiration only**. Structure and naming follow how people buy cars, not Apple TV.

---

## 2. Car-buying psychology → what the app must do

Buying a car worth tens or hundreds of millions of naira without seeing it is a high-risk decision. Research on online car buying is consistent: **trust decides the purchase**, and inspection and warranty-type guarantees are the strongest trust builders. In Nigeria the specific fears are the car's **real condition** and whether the **customs duty and papers** are genuine. The app should remove each fear in the order a buyer feels it:

| Buyer's question | What the app does |
|---|---|
| "Is this car real, and is it the actual car I'll get?" | Real photos of **this** car (no stock images), plus video where available. Each car shows its **VIN (last 6 digits)**, mileage and location. |
| "What condition is it really in?" | **Condition report** per car: inspection checklist, known issues disclosed, accident history. |
| "Are the papers clean?" | **Documents badge**: customs duty paid ✓, registration status, and what papers come with the car, backed by SarkinMota's customs team. |
| "What will it actually cost me?" | **One all-in price**: car + registration/plates (if included) + delivery, shown before checkout. No surprises. |
| "Can I afford it?" | "**or ₦X today**" (the 40% figure) shown next to every price. |
| "Can I talk to a real person?" | **WhatsApp advisor** and **Request a live video call** on every car, so the customer can see the car on camera before committing. **Book a showroom visit** stays available for those who want it. |
| "Will someone else buy it while I decide?" | **Reserve**: a small refundable deposit holds the car for N days (terms TBD). Rare cars show honest scarcity ("Only 2 in Nigeria"). |
| "Do others trust them?" | **Delivered** shelf: real handovers (photos or Instagram reels) of SarkinMota customers. |
| "Is my money safe?" | Payments through **Paystack** only, never to personal accounts. Receipts are in the app. |
| "What happens after I pay?" | **Order tracking** with real steps and photos: Paid → Preparing (detailing, plates) → Out for delivery (driver name and phone) → Delivered. |
| "What if it arrives wrong?" | **Handover check** on delivery: the customer ticks off a checklist (car matches, papers present, condition as described) before confirming receipt. |

Design consequence: the **car page is the most important screen**. It has to answer every one of these questions without making the customer ask.

---

## 3. Navigation

Plain names that say what each tab is for:

**Home · Browse · Saved · Orders · Account**

| Tab | Purpose |
|---|---|
| **Home** | Hero slides (new arrivals: images or videos), "40% now" promo, category rows, Just arrived, Rare finds, Delivered |
| **Browse** | Search + categories + filters (price, brand, body, year, "40% available") |
| **Saved** | Cars the customer is considering. Car decisions take days, so the shortlist matters. |
| **Orders** | Purchases, reservations and 40% plans, with status, payments due and delivery tracking |
| **Account** | Profile, addresses, payment cards, notifications, help (WhatsApp), legal, sign out |

---

## 4. Core flows

### 4.1 Browse as a guest, sign in only when needed
```
Splash → Home (no sign-in wall)
Save / Reserve / Buy / 40% / Request video call → Phone (+234) → OTP → name → back to the action that triggered sign-in
```

### 4.2 Car page → decision
```
Car page: media → title, price, "or ₦X today (40%)" → [Buy now] [Pay 40%] [Reserve]
          → trust stack: Condition report · Documents · What's included · Delivery estimate
          → WhatsApp advisor · Request video call · Book showroom visit
          → specs → similar cars
```

### 4.3 Buy outright
```
Buy now → Price breakdown (all-in) → Delivery address + preferred date
   → Pay (Paystack) → payment confirmed by the server → Order created → Orders tab: tracking
```
Car status: `available → reserved (during checkout or a reservation) → sold`.
Order status: `pending_payment → paid → preparing → out_for_delivery → delivered → completed` (+ `cancelled`/`refunded`).

### 4.4 Pay 40% now, rest later (terms TBD)
```
Pay 40% → Plan summary (40% today, balance, schedule placeholder) → simple application (ID, contact, employment)
   → SarkinMota reviews (web admin) → approved → pay 40% (Paystack) → delivery → balance payments in Orders
```

### 4.5 Reserve
```
Reserve → pay reservation deposit → car held until <date> → convert to Buy / 40%, or the reservation expires (refund policy TBD)
```

### 4.6 Delivery & handover
Ops updates the status from the web admin. Each step sends a push and adds a timeline entry (with a photo where possible). On arrival, the customer completes the handover checklist and taps **Confirm receipt**.

---

## 5. Screens

| # | Screen | Key content / actions |
|---|---|---|
| S1 | Splash | Logo |
| S2 | Sign in | Phone (+234) → OTP → name |
| H1 | **Home** | Hero carousel (image/video slides; **View car**), 40% promo, category tiles, rows: Just arrived · Rare finds · Executive Class · Premium SUVs · EVs · Delivered |
| B1 | **Browse** | Search, category chips, filter sheet, results grid |
| C1 | **Car page** | Media gallery; title, year · mileage · location; price + "or ₦X today"; Buy now / Pay 40% / Reserve; trust stack (Condition, Documents, Included, Delivery); WhatsApp / Video call / Showroom visit; specs; similar |
| C2 | Media viewer | Full-screen photos/video, price + Buy bar |
| C3 | Condition report | Checklist sections, disclosed issues, photos |
| P1 | Price breakdown | All-in total |
| P2 | Delivery details | Address, preferred date |
| P3 | Payment | Paystack |
| P4 | Success | → Order |
| F1 | 40% plan summary + application | — |
| SV1 | **Saved** | Grid; price changes highlighted |
| O1 | **Orders** | Active (tracking), plans (next payment), reservations (expiry), past |
| O2 | Order detail | Timeline with photos, driver contact, receipt, handover checklist, Confirm receipt |
| A1 | **Account** | Profile, addresses, cards, notifications, help, legal, sign out, delete account |

Every screen needs loading (skeletons), empty, offline and error states.

---

## 6. System

- **Mobile:** Expo (React Native, TypeScript, expo-router), `@supabase/supabase-js`, `expo-image`, `expo-video`, `expo-blur`.
- **Backend:** Supabase (Postgres + RLS, Auth with phone OTP, Storage, Edge Functions).
- **Payments:** Paystack. The checkout is initialised by an Edge Function, and payment is confirmed only through the signature-verified webhook. **The client never marks anything paid, and amounts are computed on the server.** Large amounts may exceed card limits, so **Pay with Transfer / dedicated virtual accounts** will be checked when we integrate.
- **Admin:** **web** app (Next.js + Supabase) for cars, media, hero slides, condition reports, orders/delivery, plan reviews. In the meantime, Supabase Studio.
- **Video hosting:** deferred. Video URLs are stored per media item and the host is chosen later.
- **Repo layout:** `mobile/` (Expo app), `supabase/` (migrations, seed, functions), `admin/` (later), `docs/`.

### Data (slice 1 in bold)
**brands, categories, cars, car_media, hero_slides, profiles, saved_cars**, then later condition_reports, car_documents, reservations, orders, order_events, payments, plan_applications, instalments, addresses, notifications.

---

## 7. Build plan (each slice runs on the iPhone, the Galaxy Z Fold4 and the simulator)

1. **Catalogue:** schema + seed, Home, Browse, Car page (with trust stack), media viewer. *(current)*
2. Auth (phone OTP) + Saved + Account.
3. Buy now + Paystack + Orders + tracking.
4. Reserve + 40% plan.
5. Web admin.
6. Push, deep links (WhatsApp sharing), polish.

## 8. Brand tokens

From the logo ([assets/brand/logo-source.jpg](../assets/brand/logo-source.jpg)): `gold #D6B548`, `goldHighlight #E4C461`, `bg #000`, `surface #1C1C1E`, `surfaceElevated #2C2C2E`, `text #FFF` / `rgba(235,235,245,0.6)`. System font; large title 34 bold. Dark mode only. The logo is still needed as SVG or transparent PNG.

## 9. Parked decisions (revisit after the working product)
40% plan terms · reservation deposit & refund policy · delivery coverage & fees · video hosting · Instagram sync · English/Hausa.
