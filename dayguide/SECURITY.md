# Clocka security review

Review date: 26 October 2026. Covers the iPhone/Android app, the Supabase server
(migrations 0001–0010), the RevenueCat webhook and the WordPress theme.

## How Clocka is secured

- There are no accounts or passwords. Each family has a **family code**: a random
  secret that every linked phone holds and sends with each request. Anyone with the
  code can read and change that family's data, so the code must be unguessable.
- New phones are linked with a short **link code** shown on a family phone, which is
  swapped for the family code.
- The database tables can't be read directly (row-level security on, no policies).
  Phones can only call the `dg_*` functions granted to the public key, and each one
  requires the family code or a link code.
- Premium is decided on the server only, from RevenueCat.

## Findings and fixes

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | **High** | Family codes were 10 characters (40 bits). Nothing limited how fast someone could try codes, so with many families a determined attacker could eventually hit one. | `0009_security.sql`: codes are now 32 characters (122 random bits, about 5 × 10^36 possibilities). Existing families get a new code automatically; phones switch to it on their next refresh. `0010_drop_legacy_codes.sql` retires the old codes. |
| 2 | **High** | Link codes were 6 digits. Even with the 0008 limits, a large distributed attack had roughly a 1-in-200 chance of hitting a live code. | Link codes are now 8 digits (100 million possibilities), single use, valid 15 minutes, 10 wrong tries per connection per 15 minutes and 300 wrong tries a minute in total. The chance of a hit during a code's life is now about 1 in 22,000 even under a sustained attack. |
| 3 | **High** (revenue) | `dg_set_premium` trusted the phone, so anyone could switch on Premium for free by calling the server directly. | `dg_set_premium` no longer changes anything. Premium is set only by the `revenuecat-webhook` Edge Function, which checks a secret header and then asks RevenueCat directly. |
| 4 | Medium | The family code was stored in the app's ordinary storage (included in device backups). | The code now lives in the iOS Keychain / Android Keystore (`expo-secure-store`). Older installs move it automatically. |
| 5 | Medium | The family code was sent to RevenueCat as the customer ID (fixed earlier with a hash). | RevenueCat now gets only the family's internal ID, which isn't accepted as a password anywhere. |
| 6 | Medium | Anyone could create unlimited families and flood the database. | 20 new families an hour per connection, 2,000 an hour in total. |
| 7 | Low | No size limits on names, messages and schedules. | Database limits: names 100 characters, messages 1,000, schedule 100 KB, contacts 10 KB. |
| 8 | Low | Supabase lets the public key run any new function by default. | Every helper function is now explicitly locked (`revoke`); only the app's functions are allowed. |
| 9 | Low | The App Review demo family used a short code typed directly into the app. | It now uses a reusable demo link code (`24681357`), which must be deleted after approval (see `store/app-store-listing.md`). |

## Checked and fine

- All connections are HTTPS. The public Supabase key is designed to be public; it can only call the allowed functions.
- Push notification tokens are never sent back to phones.
- Phone numbers are cleaned before dialling; links open only `tel:`, `facetime:`, `mailto:` and fixed web addresses.
- The app shows text only (no web views or HTML), so messages can't inject code. The WordPress theme escapes all output.
- Deleting a family removes everything immediately; unused families are deleted after 12 months.
- The 4-digit settings PIN is a convenience lock against accidental changes on the cared-for person's phone, not a security boundary.

## Remaining risks (accepted)

- **A lost or stolen, unlocked phone** gives access to that family's Clocka data, as with most apps. Families can delete all data from another family phone.
- **Old 10-character codes keep working until `0010_drop_legacy_codes.sql` is run.** Run it once every phone has the new build and has been opened.
- **Expo push tokens**: anyone who obtained a phone's push token could send it a notification. Tokens never leave the server. Optional hardening: turn on Expo "Enhanced Security for Push Notifications" and add the access token to `dg_push`.

## Owner checklist

- [ ] Run `0009_security.sql` in Supabase.
- [ ] Rebuild the app, update every phone, and open Clocka on each one.
- [ ] Run `0010_drop_legacy_codes.sql` (before launch).
- [ ] Deploy the `revenuecat-webhook` Edge Function and set its two secrets (see README).
- [ ] Turn on two-factor sign-in for Apple, Supabase, Expo, GitHub, RevenueCat and WordPress.
- [ ] WordPress: keep it and its plugins updated, use a strong admin password, and add a login-limiting or security plugin.
- [ ] After App Store approval, delete the demo family.
