# Authoring Deckframe slides

Copy `assets/starter.html` as `index.html` and copy `assets/deckframe.css` and `assets/deckframe.js` alongside it. Keep slide markup and styling in the user's editable files. Bundle any slide media as local files and use relative paths so the deck works when moved. The runtime uses a deferred classic script, so opening the HTML directly from disk works.

Replace the starter's examples, title, and theme. Leave the `[data-deckframe]` wrapper, the `[data-stage]` container, slide controls, and live status region in place. Place each `<section data-slide>` directly inside the stage. Give every slide a heading or an accessible label. The jump buttons are generated from slide titles.

Give each slide section a unique, descriptive HTML ID, such as
`<section id="findings" data-slide>`. Open `index.html#findings` to preview that
slide directly. Keep IDs when reordering or renaming slides so saved URLs still
work. Sections without IDs get position-based URLs such as `#slide-2`.
Navigation between slides updates the URL. Opening, refreshing, or returning to
a slide through browser history starts with its reveals hidden.

## Design the slide at rest

- Write a headline that names the idea or outcome. Give the real example,
  artifact, or measured result the space it needs to be read at presentation
  size. Remove badges and labels that repeat what the slide already shows.
- Use a consistent type scale, spacing, and surface palette across the deck.
  Choose type for the story and check it against the longest real headline and
  densest slide. Reserve mono for code and data. Give an accent a specific job,
  such as identifying the evidence the audience should inspect.
- Group the slide by what should be read together. Leave room for later reveals
  so a new line does not move the content the audience is already reading.

## Shared elements and timing

Use a presenter-controlled reveal when the audience needs to see new evidence
or a new step in the explanation. Preserve reading time between reveals.
Use a shared morph when following the same object explains the next scene,
such as carrying an error notice into the frame that shows its corrected state.
When the slide is already clear at rest, a cut is often sufficient.

```html
<section data-slide class="problem">
  <h1>Where reviews piled up</h1>
  <div class="paper-ticket" data-morph="review-ticket">Review ticket</div>
</section>
<section data-slide data-transition="cut" class="flow">
  <h2>Give the review a clear owner</h2>
  <aside class="assigned-card" data-morph="review-ticket">Review ticket</aside>
  <p data-step>Assign an owner when the review starts.</p>
</section>
```

- Put matching `data-morph` values on rendered wrappers with layout boxes. The name is case-sensitive and unique on each participating slide. Separate wrappers let several pairs morph together. Names that do not match the other slide are ordinary content.
- Keep a visual cue recognizable as the element changes size, location, or style. A highlighted sentence can become a pull quote, a drawing can move into a diagram, or a small icon can become the next slide's focal point. Use `data-transition="cut"` when you want the background to change immediately while the object travels.
- Choose `fade` (default), `slide`, `wipe`, or `cut` for scene changes. For optional catalog IDs and their stylesheet, see [Motion Library](motion-library.md). The incoming slide sets the effect when moving forward. Reversing uses the same pair with the opposite direction.
- Each `data-step` reveals with the next click or right arrow, in document order. Left arrow undoes the reveals. Put shared elements outside steps unless intentionally matching them only when their step is visible.
- Style optional entrances via `[data-enter]` or `[data-revealed]` and prefer short, finite CSS animations. Add a `prefers-reduced-motion` rule for custom effects. Deckframe itself skips shared and scene effects if reduced motion is enabled or the View Transition API is unavailable.
- Use `--df-aspect` for the stage aspect ratio. Check the narrow layout and keep essential content within the slide edges. The built-in keys are Left, Right, Home, and End, and the user can also use the on-screen controls.

When a slide demonstrates a product interaction, keep the demo's response
immediate and let its own controls remain usable during motion. If a timing
comparison varies easing or origin too, label the differences. At desktop and
narrow widths, check the most content-heavy reveal for clipping and verify
that reduced motion preserves the same information and final layout.

If verifying with Playwright, load the HTML over `file:` or on an existing safe static server. Use a browser with `document.startViewTransition` for motion evidence. A matched element appears as a `::view-transition-group(df-morph-…)` animation during the transition. Check motion as well as the final positions.
