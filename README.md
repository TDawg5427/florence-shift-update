# Florence Shift Update Mobile v1.3.3

## Fixed
- All + Add buttons work again.
- Day defaults to the actual current day again.
- Fixed the JavaScript syntax error introduced in v1.3.2.
- Asset URLs now explicitly use v1.3.3 so browsers request the new files.

## In-progress shift autosave
The unfinished shift now saves locally as you work.

If the page or Home Screen app reloads, it restores:
- day and shift times
- escape rate / checklists
- exclusions
- late starts
- walk-ins / rebookings
- cash / square
- weekly cleaning
- deep cleans
- other stuff

Clear Shift still deliberately clears everything, removes the saved draft, and resets Day to the actual current day.

## Order retained
1. Shift
2. Escape Rate / Checklists
3. Exclusions
4. Late Starts
5. Walk-Ins / Rebookings
6. Cash / Square
7. Weekly Cleaning
8. Deep Cleans
9. Other Stuff
10. Slack Update
