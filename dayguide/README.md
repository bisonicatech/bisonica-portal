# DayGuide

A phone app for people living with dementia. It shows the time, the part of the
day, and one simple instruction for right now: "It's still night-time. Go back
to bed", "Time for lunch", "Time to get ready for bed". It runs on iPhone and
Android from one codebase (Expo / React Native).

![Night, morning, afternoon and evening screens](docs/preview.png)

## What it does

- **Big, calm clock screen.** Shows the time, MORNING / AFTERNOON / EVENING / NIGHT-TIME,
  the day and date, an icon and the current message. Colours change through the day;
  night is dark and dim.
- **Daily schedule set by family.** Each entry has a time, message, icon and
  mode. A message shows from its time until the next one. Use `{name}` in a
  message to insert his name.
- **Reminder sounds during the day, silence at night.** Day entries can play a
  reminder notification at their time. Night entries never make a sound.
- **Screen stays on during the day** while the app is open, and is allowed to
  switch off at night.
- **Hidden family settings.** Hold the top-right corner of the clock for 3
  seconds, then enter the PIN (default `1234`; change it in settings).

## Try it

```
npm install
npx expo start
```

Scan the QR code with the Expo Go app on an iPhone or Android phone, or press
`w` to open it in a browser (reminders don't fire in the browser).

For real use, build an installable app with EAS:
`npx eas-cli@latest build --platform all`.

## Not built yet

- Lock-screen / home-screen widget, so the message is visible without opening
  the app (needs native widget code per platform).
- Editing the schedule remotely from a family member's phone (needs an account
  and a small backend).
- Quiet alert to a carer's phone when he's using the phone at night.
- Recorded voice messages in a family member's voice.
