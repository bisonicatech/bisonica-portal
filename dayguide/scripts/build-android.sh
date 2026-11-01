#!/usr/bin/env bash
# Builds a Clocka Android test app (APK) in Expo's cloud and gives you a link to share with testers.
# Run on a Mac (Terminal) with:
#   bash <(curl -fsSL https://raw.githubusercontent.com/bisonicatech/bisonica-portal/claude/dementia-time-awareness-app-uhkavx/dayguide/scripts/build-android.sh)
set -e

BRANCH="claude/dementia-time-awareness-app-uhkavx"
DIR="$HOME/dayguide-build"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

say "Clocka: build an Android test app"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is needed first. Install the 'LTS' version from https://nodejs.org, then run this command again."
  (open https://nodejs.org 2>/dev/null || true)
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "Git is needed first. On a Mac, a window may pop up offering to install developer tools: click Install, wait, then run this command again."
  (xcode-select --install 2>/dev/null || true)
  exit 1
fi

say "Downloading the app code"
if [ -d "$DIR/.git" ]; then
  # Keep the Expo project link that 'eas init' added last time.
  PROJECT_ID=$(node -e "try{console.log(require('$DIR/dayguide/app.json').expo.extra.eas.projectId||'')}catch(e){}")
  git -C "$DIR" fetch -q --depth 1 origin "$BRANCH"
  git -C "$DIR" reset -q --hard FETCH_HEAD
  if [ -n "$PROJECT_ID" ]; then
    node -e "const f='$DIR/dayguide/app.json',fs=require('fs'),j=JSON.parse(fs.readFileSync(f));j.expo.extra=j.expo.extra||{};j.expo.extra.eas={projectId:'$PROJECT_ID'};fs.writeFileSync(f,JSON.stringify(j,null,2)+'\\n')"
  fi
else
  git clone -q --depth 1 -b "$BRANCH" https://github.com/bisonicatech/bisonica-portal.git "$DIR"
fi
cd "$DIR/dayguide"

say "Installing (this takes a minute or two)"
npm install --no-audit --no-fund --loglevel=error

EAS="npx -y eas-cli@latest"

if ! $EAS whoami >/dev/null 2>&1; then
  say "Log in to your Expo account"
  $EAS login
fi

say "Linking the app to your Expo account (answer Y if asked)"
$EAS init --non-interactive 2>/dev/null || $EAS init

say "Building the Android test app in Expo's cloud (about 15 minutes)"
echo "When asked:"
echo "  - 'Generate a new Android Keystore?' -> Y (Expo keeps it safe for you)"
echo "  - 'What would you like your Android application id to be?' -> press Enter"
$EAS build --platform android --profile preview

say "Done! Above is a link (and a QR code) to the Android app."
echo "Send that link to your Android testers. They open it on their phone, tap Install,"
echo "and allow 'install unknown apps' if asked. You can also find it later at https://expo.dev under Builds."
