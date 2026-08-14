# Florence Shift Update Mobile v1.1.0

## Changes
- Renamed Games to Rooms Ran.
- Walk-Ins are repeatable entries by employee.
- Rebookings are repeatable entries by employee.
- Added Cash and Square payment tracking.
- Added Weekly Checklist status: Worked On or Completed.
- Added Deep Clean checkboxes for A8, BB, ESP, FTF, Lobby, Bathrooms, and Host Room.
- Added Shoutouts.
- Removed the old "Humanity survives another shift" header text.
- Bumped the service-worker cache so installed iPhone web apps refresh to the new version.

## Updating the existing GitHub Pages app
You do not need a new repository or a new Home Screen icon.

Replace these files in the existing repository:
- index.html
- app.js
- style.css
- service-worker.js
- README.md

You can also replace all files from this ZIP if that is easier.

After GitHub Pages redeploys, open the app once in Safari or from the Home Screen while online. iOS should fetch the updated cached files.
