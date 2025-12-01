# GitHub Actions - Build APK

This repository includes a GitHub Actions workflow to automatically build an Android APK for the Barug mobile app.

## Setup Instructions

### 1. Get Your Expo Token

You need to generate an Expo access token:

```bash
# Login to your Expo account
npx eas-cli login

# Generate a token
npx eas-cli build:configure
```

Or generate a token from the Expo website:

1. Go to <https://expo.dev/accounts/[your-username]/settings/access-tokens>
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token

### 2. Add the Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo token
6. Click **Add secret**

### 3. Trigger the Build

The workflow runs automatically on:

- Push to `master` or `pre/dev` branches
- Pull requests to `master`
- Manual trigger via **Actions** tab → **Build Android APK** → **Run workflow**

## Build Process

The workflow:

1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies
4. Submits a build to EAS (Expo Application Services)
5. The build runs on Expo's servers

## Download the APK

After the workflow completes:

1. Go to <https://expo.dev/accounts/[your-account]/projects/barug/builds>
2. Wait for the build to finish (usually 10-15 minutes)
3. Download the APK file

Or use the CLI:

```bash
eas build:list --platform android --limit 1
```

## Local Build (Alternative)

To build locally instead of using GitHub Actions:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
eas build --platform android --profile preview
```

## Build Profiles

The workflow uses the `preview` profile from `eas.json`:

- Builds an APK (not AAB)
- Uses release signing
- Suitable for testing and distribution outside Google Play

## Troubleshooting

**Build fails with authentication error:**

- Verify `EXPO_TOKEN` is set correctly in GitHub Secrets
- Make sure the token hasn't expired

**Build takes too long:**

- EAS builds run on Expo's servers and typically take 10-20 minutes
- Check build status at <https://expo.dev>

**Need to configure Android signing:**

- EAS handles signing automatically for preview builds
- For production builds, configure keystore in your Expo account
