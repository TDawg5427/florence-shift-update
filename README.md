# Florence Shift Update Mobile v1.1.1

This build fixes iPhone/Home Screen caching.

## Important changes
- Keeps all v1.1 features:
  - Rooms Ran
  - repeatable Walk-Ins
  - repeatable Rebookings
  - Cash / Square
  - Weekly Checklist status
  - Deep Clean checkboxes
  - Shoutouts
- Removes the old offline cache behavior.
- Automatically unregisters the old service worker.
- Deletes old cached app files.
- Adds versioned CSS/JS URLs.
- Shows `v1.1.1` in the top-right of the app so you can immediately confirm the update loaded.

## Replace these files in GitHub
Upload/replace ALL files from this folder in the same repository.

After GitHub Pages redeploys, on the iPhone open the GitHub Pages address in Safari with:

`?v=1.1.1`

at the end.

Example:
`https://USERNAME.github.io/REPOSITORY/?v=1.1.1`

Once you see `v1.1.1` at the top, close the Home Screen app and reopen it.

If the existing Home Screen icon still opens the old version, delete only the Home Screen icon and add the site to Home Screen again. You do NOT need to change the GitHub repository.
