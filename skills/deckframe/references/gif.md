# GIF export

Run the helper only when the user requests a GIF. It opens the supplied local Deckframe HTML file, walks slides and reveals with the right arrow, samples browser animations, and encodes the stage as a looping GIF. Slide holds give the viewer time to read. GIF pacing is independent of the editable deck.

Run with Node.js, an available Playwright installation and Chromium (installed Chrome works), and FFmpeg on PATH.

```sh
node <skill-dir>/scripts/export-gif.cjs <deck-dir>/index.html <deck-dir>/deck.gif
```

The exporter accepts `--width 960`, `--hold-ms 1500`, `--fps 20`, `--playwright /path/to/playwright`, and `--browser /path/to/chrome`. Use the existing or bundled Playwright if the default require cannot resolve it. If the host provides a bundled runtime, look there before installing anything and pass the absolute path to its `playwright` module. The helper can use Chrome in its usual macOS location or Playwright's existing Chromium. Pass the explicit executable for another compatible installation if needed.

Defaults are a viewport width of 960, 20 frames per second, and 1,250 ms per slide or reveal. Increase the hold if there is more text to read. The exporter encodes the stage without the controls. It crossfades from the finale back to the first slide before the loop repeats, carrying any matching morph names across the seam. This choice applies only to the GIF. It samples finite Web Animations and CSS animations up to two seconds per advance, holding the initial frame of any indefinite Web Animation or CSS animation that is already running during a capture. This is for Deckframe slides and reveals. Embedded video and timer-driven scenes are outside the exporter’s supported timeline.

Verify dimensions, duration, and loop metadata, then inspect representative frames from the beginning, a shared morph, key reveals, the last slide, and the return to the first slide. If the dependencies are unavailable, finish and deliver the editable HTML, and identify the prerequisite for GIF export.
