---
name: pi-screenshot
description: Use the latest automatic screen capture path reported by the pi-screenshot extension in the system prompt when user asks about on-screen content or when the request is ambiguous and visual context can disambiguate intent. "Look at this" is a key phrase.
---

# Screenshot Context

The `pi-screenshot` extension captures a screenshot before each user message from the monitor that currently contains the mouse pointer.

## Screenshot path

- Use the exact screenshot path reported in the current system prompt block from the extension.
- The extension computes this path via Node's `os.tmpdir()` and appends `/pi-screenshot/latest.png`.

## How to use

1. If the user asks about what is visible on screen, use `read` on the exact screenshot path reported in the system prompt.
2. If the user request is vague and visual context could improve answer quality, proactively inspect `/tmp/pi-screenshot/latest.png`.
3. Mention what you observed and tie it directly to the user’s request.

## Notes

- The capture is one monitor only: whichever monitor currently has the mouse pointer.
- Do not assume this image is relevant when the user asks purely abstract questions.
