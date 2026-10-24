#!/usr/bin/env bash
# Builds the DayGuide iPhone app in Expo's cloud and uploads it to TestFlight.
# Run on a Mac (Terminal) with:
#   bash <(curl -fsSL https://raw.githubusercontent.com/bisonicatech/bisonica-portal/claude/dementia-time-awareness-app-uhkavx/dayguide/scripts/build-iphone.sh)
set -e

BRANCH="claude/dementia-time-awareness-app-uhkavx"
DIR="$HOME/dayguide-build"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

say "DayGuide: build the iPhone app and send it to TestFlight"

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

say "Building in Expo's cloud and uploading to TestFlight"
echo "When asked:"
echo "  - 'Log in to your Apple account?'  -> Y, then your Apple ID, password and the 6-digit code"
echo "  - Anything about certificates, provisioning profiles or push keys -> Y (let Expo create them)"
echo "  - 'What would you like your iOS bundle identifier to be?' -> press Enter"
$EAS build --platform ios --profile production --auto-submit

say "Done! Apple takes 15-30 minutes to process the upload. Then tell Claude it's finished."
