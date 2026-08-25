# NeuroAssess — self-hosted edition

This is a self-hosted version of the NeuroAssess app (motor speed + verbal
recall assessments, with a live results dashboard). Unlike the Claude
Artifact version, **any phone can submit its results automatically** —
there's no "signed-in Claude account with write access" requirement, because
this version stores results in your own Google Sheet instead of publishing
back to a Claude artifact.

It's a single static file (`index.html`) plus a small Google Apps Script
backend. No server to run, no framework, no build step for you to manage
day-to-day (the `build.js` here was already run for you — `index.html` is
ready to deploy as-is).

## How it works

- `index.html` — the whole app. Runs entirely in the browser.
- Each phone that completes an assessment sends its result with a plain
  `fetch()` call to a Google Apps Script "Web App" URL you deploy.
- The dashboard polls that same URL every 5 seconds and re-renders, so
  results appear on your screen shortly after each phone submits — no
  reading numbers aloud, no manual entry.
- `apps-script/Code.gs` is the backend: it appends each submission as a row
  in a Google Sheet, and serves all rows back as JSON.

## Setup (about 15–20 minutes, one time)

### 1. Create the backend (Google Sheets + Apps Script)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "NeuroAssess Results."
2. In the sheet, go to **Extensions → Apps Script**. This opens the Apps
   Script editor, already linked to this sheet.
3. Delete whatever's in the default `Code.gs` file, and paste in the
   entire contents of `apps-script/Code.gs` from this folder.
4. Click **Deploy → New deployment**.
5. Click the gear icon next to "Select type" and choose **Web app**.
6. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
   (This does *not* give anyone access to your Google account or sheet
   directly — it only lets anyone call these two specific functions,
   `doGet`/`doPost`, which only read/append rows in this one sheet.)
7. Click **Deploy**. The first time, Google will ask you to authorize the
   script — click through the consent screens (it'll warn that the app
   isn't verified, since it's your own private script; click "Advanced" →
   "Go to (project name)" to proceed).
8. Copy the **Web app URL** it gives you — it looks like
   `https://script.google.com/macros/s/AKfycb.../exec`. You'll need this
   in the next step.

**If you ever edit `Code.gs` later:** you have to make a *new* deployment
(Deploy → Manage deployments → pencil icon → New version) for the changes
to take effect — editing the script alone doesn't update the live URL.

### 2. Point the app at your backend

1. Open `index.html` in a text editor.
2. Find this near the top (search for `CONFIG`):
   ```js
   var CONFIG = {
     APPS_SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
   };
   ```
3. Replace the placeholder with the Web app URL you copied in step 1.8.
4. Save the file.

### 3. Host it on GitHub Pages

1. Create a new GitHub repository (public or private both work).
2. Add `index.html` (with your URL filled in) to the repo — either drag
   it into the GitHub web UI, or:
   ```
   git init
   git add index.html
   git commit -m "Add NeuroAssess self-hosted app"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to "Deploy from a branch,"
   pick the `main` branch and the `/ (root)` folder, then **Save**.
5. GitHub will give you a URL like `https://<you>.github.io/<repo>/` —
   that's your live app. It can take a minute or two to go live the first
   time.

### 4. Try it

- Open the GitHub Pages URL yourself, enter a name, and run through the
  motor speed assessment on your own phone or computer.
- Open the same URL, go to `#/dashboard` (tap "Dashboard" from the menu),
  and confirm your result shows up within a few seconds.
- If it doesn't show up: open your browser's dev tools console on the
  dashboard page and look for errors — see Troubleshooting below.

Once that works, the QR code on the menu screen (auto-generated from the
page's own URL — no extra setup needed) is what you hand out for others to
scan.

## Troubleshooting

**Dashboard says "Not connected to a results sheet yet."**
`CONFIG.APPS_SCRIPT_URL` still has the placeholder text — go back to step
2.

**Submitting hangs on "Saving…" and never resolves, or times out.**
Usually means the Apps Script deployment's access isn't set to "Anyone."
Go to Deploy → Manage deployments in the Apps Script editor and check the
setting from step 1.6.

**Dashboard shows "Couldn't reach the results sheet."**
Open the Apps Script Web app URL directly in a browser (paste it into the
address bar). You should see raw JSON like `{"sessions":[...]}`. If you
get an error page instead, the deployment itself is broken — check
Extensions → Apps Script → Executions in your sheet for the error detail.

**A submission says "Sent, but couldn't confirm it was saved."**
The `fetch()` POST likely went through, but the follow-up check (which
re-reads the sheet to confirm) didn't find it within ~2 seconds — this can
happen on a slow connection. Check the dashboard or the Sheet directly; if
the row is there, it's fine. If it's not, the person can just retake the
assessment and submit again.

**I want to reset all the results.**
Just delete the data rows in the Google Sheet's "Sessions" tab (keep the
header row). The dashboard will reflect that on its next refresh.

## Notes

- This version has no login and no per-user write restrictions — anyone
  with the link can both take assessments *and* see the dashboard. If you
  need this to be more restricted, that would require actual
  authentication, which is out of scope for this lightweight setup.
- The word list baked into the Verbal Recall Assessment is the same
  144-words-per-category list from the `Verbal_Recall_Word_List.xlsx` you
  already have — see that file's README tab for methodology.
- `app-src.html` is the readable source (with placeholders like
  `__QRCODE_LIB__`); `build.js` bakes the QR code library and word list
  into it to produce the final `index.html`. You generally don't need to
  touch `build.js` — the `index.html` in this folder is already built and
  ready to deploy. Only re-run `node build.js` if you make source edits to
  `app-src.html` yourself.
