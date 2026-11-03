# Clocka beta testing kit

- `clocka-tester-briefing.pdf`: send to testers (also published as a web page).
- `clocka-tester-feedback-google-forms.gs`: builds the feedback form in Google Forms.

## Before you send anything

1. **Build the feedback form.** Run the script at script.google.com and copy the "Send this link" address.
2. **iPhone testers: TestFlight access.** In App Store Connect → Clocka → **TestFlight**:
   - Add a group under **External Testing** (for example "Friends"), add the latest build, and fill in the **Test Information** (feedback email info@clocka.co.uk, and what to test: "See the tester briefing").
   - Apple reviews the first build for external testing, usually within a day.
   - Then either **add testers by email** (they need their Apple ID email) or turn on the **Public Link** and send that.
3. **Android testers: the download link.** Run the Android build (`scripts/build-android.sh`) and copy the link it shows, or find it at expo.dev → Clocka → Builds → the latest Android build → Share.
4. **Pairs.** Each test needs two phones (the clock and the family phone). Ask people to test with someone at home or a friend, or offer to be the family phone yourself.

## Message to send (fill in the three links)

> Hi! Thanks so much for helping test **Clocka**, the day clock app for families living with dementia. 🙏
>
> 📄 **How to test** (about 30 minutes): [briefing link or attach the PDF]
> 📲 **Download:** iPhone: [TestFlight link] · Android: [Android download link]
> 📝 **Feedback form** (5 minutes, please within a week): [feedback form link]
>
> You'll need a partner with a second phone (one is the clock, one is the family phone). iPhone and Android can be mixed. If you're on your own, message me and I'll be your family phone.
>
> Please use made-up names, as it's test data. Any problems or screenshots: reply here or email info@clocka.co.uk. Thank you!

## Also worth doing

- **Keep a tester list** (name, phone type, Apple ID or Gmail, date invited, feedback received). It helps you chase feedback and invite people to new builds.
- **Android: you need 12+ testers for 14 days in a row** in a Google Play closed test before a public launch. The feedback form asks Android testers for their Gmail and whether they'll keep testing.
- **Send me the form results** (Responses → Sheets → File → Download → CSV), and I'll turn them into a fix list.
- **After testing**, testers can delete their test data in the app (the briefing's last step).
