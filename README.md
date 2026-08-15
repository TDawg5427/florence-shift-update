# Florence Shift Update Mobile v1.3.2

## Changes

### Walk-Ins / Rebookings combined
Input now keeps Walk-Ins and Rebookings together in one card.

Output now looks like:

```text
Walk-Ins / Rebookings:
1 WI via TJ
1 RB via TJ
```

Milestones are preserved:
```text
1 WI via TJ - TJ is at 5
1 RB via Izzy - Izzy is at 10
```

### New input and output order
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

Cash and Square are together in one input card, while the Slack output keeps the separate `Cash:` and `Square:` labels.

### Preserved behavior
- `No rooms` when Escapes and Rooms Ran are both 0
- Employee milestones for Walk-Ins / Rebookings
- Exact `Worked on weekly checklist` / `Finished weekly checklist` wording
- Deep Cleans
- Late Starts
- Exclusions
- Merch / Training / Shoutouts / Notes
- Copy Shift Update
- Manager preference saved locally
- Cache-cleanup behavior from v1.3.1

## GitHub Pages update

Replace the existing repository files with the files in this folder.

Then open:
`https://YOURUSERNAME.github.io/YOURREPOSITORY/?v=1.3.2`

The top-right version badge should show `v1.3.2`.
