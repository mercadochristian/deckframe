# Deckframe Motion Library

Use a motion ID where the presenter specifies one. If they omit an ID, build
the full deck and choose effects according to what the audience needs to follow.
For example, “Use `scene-push` into the walkthrough and
`reveal-diagram-trace` for the connection I explain.”

For CSS effects, copy `deckframe-motion.css` alongside the generated deck's runtime
and load it after `deckframe.css`. In the installed skill it lives at
`assets/deckframe-motion.css`. Use the updated Deckframe runtime for custom
`scene-*` effects and keep the deck portable with relative paths.

| ID | Apply it to |
| --- | --- |
| `scene-panel-turn` | Incoming slide. Tilt the two panels through depth. |
| `scene-push` | Incoming slide. Move both slides together horizontally. |
| `scene-curtain` | Incoming slide. Uncover the next scene from the top. |
| `scene-zoom-through` | Incoming slide. Zoom the outgoing scene through the incoming scene. |
| `scene-iris` | Incoming slide. Open a circular mask onto the next scene. |
| `enter-soft-rise` | One object or line of text. Lift it into view with a fade. |
| `enter-masked-title` | A wrapper with one direct `data-motion-item` child. Reveal the child from its baseline. |
| `enter-side-glide` | One object. Glide in with a fade. Use `--df-entry-from` to set the horizontal offset. |
| `enter-focus` | One object. Scale gently to its resting size. |
| `enter-line-wipe` | One line or short label. Uncover it left to right. |
| `reveal-window-stack` | A group with two or three direct `data-motion-item` children. Reserve their space. |
| `reveal-row-cascade` | A list with up to four direct `data-motion-item` children. Stage them in reading order. |
| `reveal-diagram-trace` | An SVG wrapper with a stroked path marked `data-motion-item` and `pathLength="1"`. |
| `emphasis-marker` | A short phrase. Sweep in an underline. |
| `emphasis-ring` | A result or pill. Bring the outline into place. |
| `emphasis-spotlight` | A result or chip. Briefly highlight its edge. |
| `action-travel` | A small cue. Set `--df-travel-from` to adjust the horizontal start offset. |
| `action-arc` | A small cue with space for a short hop to its right. |
| `action-pivot` | A small card or icon. Turn it forward around its vertical axis. |
| `exit-soft-drop` | An exit wrapper. Fade the departing item down. |
| `exit-side-glide` | An exit wrapper. Glide the departing item sideways. |
| `exit-mask-close` | An exit wrapper. Mask the departing item from bottom to top. |
| `ambient-drift` | Decoration only. Drift once for four seconds. |
| `ambient-orbit` | Decoration only. Trace a small loop once. |
| `ambient-pulse` | Decoration only. Pulse once, then return to rest. |
| `story-shared-anchor` | Successive slides. Carry one recognizable object through the story using Deckframe's built-in morph. |

Set `data-transition="<scene-id>"` on an incoming slide. Panel turn and side push
reverse their horizontal direction on Back. A deck without View Transitions or
with reduced motion cuts to the final scene. Keep controls and progress outside
the stage so those controls stay steady.

For other effects, set `data-motion="<id>"`. Add `data-step` for a
presenter-controlled reveal or `data-motion-on-enter` on an already visible
element for an automatic entrance after the scene animation. Direct loading
shows the slide in its resting state. Reduced motion shows the same content
without the movement.

For an `exit-*` effect, the wrapper needs two direct children. Mark the
departing noninteractive item with `data-motion-item` and the later reveal
with `data-step`. Reveal dismisses the first item. Back restores it.
Reserve enough room for the two states.

For `story-shared-anchor`, put the same unique `data-morph` value on the object's
wrapper on every participating slide. Use clear resting positions, connected
by a visible track when the topic calls for one. Keep the text stationary
while the object moves and leave time to read each slide. The built-in morph
works without the motion stylesheet. Every slide must still tell the story
when reduced motion shows only the resting positions.

If an ID cannot be resolved, deliver the deck with a simple fallback and
name the substitution in the handoff.
