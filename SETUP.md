# Quick Setup Guide

## Step 1: Get Your Spotify Credentials

1. Visit https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Enter:
   - **App Name**: Minimalist Player
   - **App Description**: A minimalist Spotify player
   - **Redirect URI**: http://localhost:5173/callback
   - Check the agreement box
5. Click "Save"
6. Click "Settings" 
7. Copy your **Client ID**

## Step 2: Configure Your App

Open `.env.local` in this project and replace `your_spotify_client_id_here` with your actual Client ID:

```
VITE_SPOTIFY_CLIENT_ID=abc123def456...your_client_id
VITE_REDIRECT_URI=http://localhost:5173/callback
```

## Step 3: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser

## Step 4: Use the App

1. Click "Connect Spotify"
2. Log in with your Spotify Premium account
3. Authorize the app
4. Search for music and enjoy!

## Troubleshooting

**"Premium Required" error**: The Spotify Web Playback SDK requires a Premium account.

**Authentication error**: Make sure your Client ID is correct in `.env.local`

**Redirect error**: Ensure `http://localhost:5173/callback` is added as a Redirect URI in your Spotify app settings.
