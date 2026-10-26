# Clocka roadmap

Agreed plans for future releases. Check this file before planning or building any release.

## Version 1.1 (first update after App Store approval)

### "I'm lost" button (agreed, must ship in 1.1)

Free for everyone. Safety features are never behind Premium.

**Cared-for person's phone**
- A clear **I'm lost** button on the clock, hidden at night like the Call button.
- Tapping it asks "Do you need help finding your way?" with a big **Yes**, to avoid accidental alerts.
- The screen then says: "Stay where you are. {carer} has been told and will call you very soon.", with a big Call button.
- Sends the phone's location, and updates it about every minute while the screen is open.
- Location is read only when the button is used (When In Use permission, never background tracking).

**Family phones (all linked family members, not only the main one)**
- Urgent push alert: "{name} needs help finding their way".
- A red card showing the time, a map link (Apple Maps / Google Maps) and a **Call {name}** button.
- **I'm on my way** button: the cared-for screen changes to "{carer} is on the way. Stay where you are."
- **All okay** button ends the alert.

**Also needed**
- The cared-for person's phone number in setup and settings, so the family can call back.
- Server: keep only the latest location, and delete it when the alert ends (or after 24 hours at most).
- Privacy policy (app, legal/privacy.html, website page-privacy.php) and App Store privacy answers: add Precise Location, App Functionality, not used for tracking.
- iOS location permission text in app.json.
- A short DPIA (data protection risk assessment) for the ICO.
- Wording: "lets your family know where you are", never "keeps them safe". Not a tracker; the phone must be with them, charged and online.
- User guide and website: describe the feature and point families to the Herbert Protocol (UK police scheme) and iPhone Find My / location sharing.

### Suggested (not yet agreed)
- **I'm okay button inside the check-in notification**, so check-ins can be answered from the lock screen or an Apple Watch (about a day's work).
- **Apple Watch face complication** showing the part of the day and the current message (1–2 weeks).
- **Full Apple Watch app** (3–4 weeks or more), and later Wear OS.

## Before launch (1.0) — outstanding

- Security (see SECURITY.md): run `0009_security.sql`, rebuild, open Clocka on every phone, then run `0010_drop_legacy_codes.sql`.
- Connect RevenueCat (needs the `appl_` public key) and deploy the `revenuecat-webhook` Edge Function (Premium is now set only by it).
- After App Store approval: delete the demo family (SQL in `store/app-store-listing.md`).
- Subscription review screenshot, final build, App Store submission.
- Link to the user guide from the in-app Help screen.
- Android: Play Console, Firebase push, closed test (12 testers for 14 days).
