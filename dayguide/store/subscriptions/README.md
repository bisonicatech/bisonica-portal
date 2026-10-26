# Clocka Premium: setting up subscriptions in App Store Connect

Open **App Store Connect → Apps → Clocka → Monetization → Subscriptions**.
(The Paid Apps Agreement must be accepted first, or subscriptions can't be created.)

Images in this folder:
- `clocka-premium-review-screenshot.png`: the upgrade screen, for **Review Information** (both subscriptions).
- `clocka-premium-promo-1024.png`: optional promotional image (1024 × 1024).

---

## Step 1: Create the subscription group

Tap **+** next to Subscription Groups.

| Field | Enter |
|---|---|
| Reference Name | `Clocka Premium` |

Then, in the group, under **App Store Localization**, tap **+** / **Create**:

| Field | Enter |
|---|---|
| Language | English (U.K.). Add English (U.S.) too if that's the app's primary language |
| Subscription Group Display Name | `Clocka Premium` |
| App Name Display Options | Use App Name |

---

## Step 2: Create the two subscriptions

In the group, tap **Create** (or **+**) for each:

| Field | Yearly | Monthly |
|---|---|---|
| Reference Name | `Clocka Premium Yearly` | `Clocka Premium Monthly` |
| Product ID (can't be changed later) | `clocka.premium.yearly` | `clocka.premium.monthly` |

Then open each subscription and fill in the sections below.

### Subscription Duration
Yearly: **1 Year**. Monthly: **1 Month**.

### Availability
**All countries or regions** (untick EU countries if you decide not to sell there yet).

### Subscription Prices
1. Tap **Add Subscription Price**.
2. Country or region: **United Kingdom (GBP)**.
3. Price: **£24.99** (yearly) or **£2.99** (monthly).
4. Tap **Next**. Apple fills in matching prices for other countries. Tap **Next**, then **Confirm**.

### Introductory Offer (the free month)
In **Subscription Prices**, tap **+** (or **View all subscription pricing → Introductory offers**) → **Create Introductory Offer**:

| Field | Enter |
|---|---|
| Countries or regions | All |
| Start date | Today |
| End date | No end date |
| Type | **Free** |
| Duration | **1 Month** |

Do this for both subscriptions.

### App Store Localization (what customers see)

| Field (limit) | Yearly | Monthly |
|---|---|---|
| Display Name (30) | `Clocka Premium (yearly)` | `Clocka Premium (monthly)` |
| Description (45) | `Unlimited times, family and messages` | `Unlimited times, family and messages` |

### Image (optional)
Upload `clocka-premium-promo-1024.png`. It's only used if you promote the subscription on the App Store. Leave it out if you prefer. Apple reviews it if it's there.

### Review Information
- **Screenshot:** upload `clocka-premium-review-screenshot.png`.
- **Review Notes:** paste:

> Clocka Premium unlocks unlimited daily times (with a different schedule for each day of the week), unlimited linked family members, custom Out mode and one-off messages on the cared-for person's screen, extra call buttons and a FaceTime video call button. One subscription covers every phone linked to the same family.
>
> To reach the purchase screen: open Clocka, choose "A family member or carer", then "Set up for the first time", enter any two names and tap Continue. Then tap "Free plan · Try Premium free for a month".
>
> The demo family in the app review notes (link code 24681357) already has Premium enabled, so all Premium features can be tried without buying.

### Family Sharing
Leave **off**. Once turned on it can never be turned off, and Clocka already shares Premium with every linked family phone.

### Tax Category
Leave as the default.

---

## Step 3: Order in the group

Put **Clocka Premium Yearly** at **Level 1** and **Monthly** below it. (Same features, so the order only affects how upgrades and downgrades are handled.)

## Step 4: Check status
Each subscription should change from **Missing Metadata** to **Ready to Submit**.

## Step 5: Submit with the app
The first subscriptions must be reviewed with an app version. On the **1.0 version page**, scroll to **In-App Purchases and Subscriptions**, tap **+** and select both. They're then submitted when you press **Submit for Review**.

---

## Notes
- The prices and free trial shown in the app come from the App Store automatically (through RevenueCat), so they always match what's set here.
- The review screenshot shows the real upgrade screen with these prices. If Apple asks for a screenshot from a device, take one on TestFlight after payments are connected.
