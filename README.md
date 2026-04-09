# pi-screenshot extension

This extension captures a screenshot of the display currently containing the mouse pointer before each user message.

## Capture script

The screenshot capture logic lives in a standalone Swift script:

- `capture-active-display.swift`

Run it directly:

```bash
swift capture-active-display.swift /tmp/pi-screenshot/latest.png
```

It writes a single PNG to the output path you provide.

## Extension integration

`pi-screenshot.ts` calls the script with:

- Script path: `<extension-dir>/capture-active-display.swift`
- Output path: `<os temp dir>/pi-screenshot/latest.png` (resolved via Node `os.tmpdir()`)

## Requirements

- macOS with Swift available
- Screen recording permission for the terminal/app running Pi (System Settings → Privacy & Security → Screen Recording)
