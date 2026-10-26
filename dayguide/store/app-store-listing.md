# Clocka: App Store Connect listing

Copy each part into App Store Connect. Character limits are Apple's; the
counts below were checked.

---

## App Information

| Field | Enter |
|---|---|
| Name | Clocka |
| Subtitle | Family day clock for dementia |
| Primary category | Lifestyle |
| Secondary category | Health & Fitness |
| Content rights | No, it does not contain, show or access third-party content |
| Age rating | Answer **None** / **No** to every question → **4+** |

## Pricing and Availability

- Price: **Free** (Premium is sold as an in-app subscription).
- Availability: all countries, or untick the EU countries if you decide not to sell in the EU yet.

## Version information (1.0)

**Promotional text** (can be changed any time without review)

> A gentle day clock for someone living with dementia: the time, whether it's day or night, and one simple thing to do now. The family can help from their own phones.

**Description**

> Clocka is a gentle day clock for someone living with dementia, and a companion app for the family who support them.
>
> It started at 3 o'clock in the morning: a dad who kept waking, getting dressed and starting his day, and a family looking for something simple to answer the question he kept asking: what should I be doing now?
>
> FOR THE PERSON YOU CARE FOR
> • A big, clear clock with the day, the date and whether it's morning, afternoon, evening or night
> • One simple message for right now, in your own words: "Time for breakfast", "Time for a cup of tea", "Time to get ready for bed"
> • Calm and silent at night: woken at 3am, they see "It's still night-time. Go back to bed."
> • Gentle reminder sounds during the day, never at night
> • A big button to call you
>
> FOR THE FAMILY
> • Plan their day from your own phone and see what their screen says right now
> • Out mode: popping to the shops? Their screen says where you've gone and when you'll be back
> • Check-ins: Clocka asks "Are you okay?" while you're out, and lets you know if there's no answer
> • Settings are protected by a long press and a 4-digit PIN, so the clock stays as you set it
>
> CLOCKA PREMIUM
> Start free with up to 8 daily times, one family member, Out mode and check-ins. Premium adds:
> • Unlimited daily times, different on each day of the week
> • Unlimited family members
> • Your own Out messages, and one-off messages to their screen
> • Extra call buttons and a FaceTime video call button
> Premium is £2.99 a month or £24.99 a year, with a 1-month free trial. One subscription covers the whole family.
>
> PRIVACY
> No adverts, no tracking and no selling of data. Clocka keeps only what it needs, and you can delete everything from inside the app.
>
> Clocka is a daily routine and reminder app. It is not a medical device and does not diagnose, treat or monitor any condition. In an emergency, call 999.
>
> Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel them in your Apple ID settings.
> Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
> Privacy policy: https://clocka.co.uk/privacy/

**Keywords** (no spaces after commas)

```
dementia,alzheimers,day clock,memory,carer,reminder,routine,elderly,parent,calendar,orientation,care
```

| Field | Enter |
|---|---|
| Support URL | https://clocka.co.uk/support/ |
| Marketing URL | https://clocka.co.uk |
| Copyright | 2026 Jason Nicholls |
| Version | 1.0.0 |

**Screenshots:** upload the five files in `store/screenshots/` (1290 × 2796) to the
**6.9-inch iPhone** slot, in order 1 to 5. Apple scales them for smaller iPhones.

---

## App Privacy questionnaire

Privacy Policy URL: `https://clocka.co.uk/privacy/`

"Do you or your third-party partners collect data from this app?" → **Yes**

Tick these data types. For **every** one, answer:
- Purpose: **App Functionality** only
- Linked to the user's identity: **Yes**
- Used for tracking: **No**

| Category | Data type | What it is in Clocka |
|---|---|---|
| Contact Info | **Name** | First names of the person cared for and family members |
| Contact Info | **Phone Number** | Numbers for the Call buttons |
| User Content | **Other User Content** | Schedule, Out mode and one-off messages |
| Identifiers | **User ID** | The household code that links the family's phones |
| Identifiers | **Device ID** | Notification tokens for reminders and alerts |
| Purchases | **Purchase History** | Whether the household has Premium (via Apple and RevenueCat) |

Do **not** tick: Location, Contacts, Health & Fitness, Financial Info, Browsing or
Search History, Usage Data, Diagnostics, Sensitive Info. Clocka collects none of
these.

---

## In-app purchases (Subscriptions)

Subscription group: **Clocka Premium** (display name: Clocka Premium)

| | Monthly | Yearly |
|---|---|---|
| Reference name | Clocka Premium Monthly | Clocka Premium Yearly |
| Product ID | `clocka.premium.monthly` | `clocka.premium.yearly` |
| Duration | 1 month | 1 year |
| Price (UK) | £2.99 | £24.99 |
| Introductory offer | Free trial, 1 month, new subscribers | Free trial, 1 month, new subscribers |
| Display name | Clocka Premium (monthly) | Clocka Premium (yearly) |
| Description | Unlimited times, family and messages | Unlimited times, family and messages |

Full step-by-step instructions, review notes and images are in
[`subscriptions/README.md`](subscriptions/README.md).

On the version page, under **In-App Purchases and Subscriptions**, add both
subscriptions so they're reviewed with the app.

---

## App Review Information

- Sign-in required: **No** (untick)
- Contact: Jason Nicholls · your phone · info@clocka.co.uk
- Notes:

> Clocka has no accounts or logins. It is a day clock for people living with dementia, plus a companion mode for their family.
>
> To try the family features on one device: open Clocka, choose "A family member or carer", then "I have a code". Enter any name and the demo link code 24681357, then tap Continue. You'll see the demo family "Margaret" with Premium enabled: you can edit the daily schedule, start Out mode, send a message to Margaret's screen, and add call buttons.
>
> To see the clock that the person being cared for uses: delete and reinstall the app (or use a second device), choose "The person being cared for", type any name, and either enter the demo link code 24681357 (to link it to the demo family) or leave it empty, then tap Start. The settings PIN is 1234 (hold the time on the clock for 3 seconds to open settings).
>
> Premium is an auto-renewing subscription (£2.99/month or £24.99/year, 1-month free trial) that covers every phone linked to a family. Help and support, the privacy summary and data deletion are on the family screen.

Before submitting, create the demo family in Supabase (SQL Editor). This needs
`0009_security.sql` to have been run. It removes any earlier demo family first, so
it's safe to run again (for example if a reviewer deletes the demo family).

```sql
delete from dg_households
 where code = '2468013579' or legacy_code = '2468013579'
    or id in (select household_id from dg_link_codes where link_code = '24681357');

with h as (
  insert into dg_households (code, patient_name, carer_name, carer_phone, comp)
  values (dg_new_code(), 'Margaret', 'Sam', '', true)
  returning id
)
insert into dg_link_codes (link_code, household_id, expires_at, reusable)
select '24681357', id, now() + interval '1 year', true from h;
```

**After the app is approved**, remove the demo family so nobody else can use the code:

```sql
delete from dg_households
 where id in (select household_id from dg_link_codes where link_code = '24681357');
```
