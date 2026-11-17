const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { parseArgs } = require('node:util')

const usage = 'Usage: node export-gif.cjs <deck.html> <output.gif> [--width 960] [--hold-ms 1250] [--fps 20] [--playwright /path/to/playwright] [--browser /path/to/chrome]'

function integer(value, label, min, max) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`)
  }
  return number
}

async function captureDeck(page, source, directory, { fps, hold }) {
  await page.goto(pathToFileURL(source).href)
  const stage = page.locator('[data-deckframe-ready] [data-stage]')
  await stage.waitFor()
  const slides = stage.locator(':scope > [data-slide]')
  const stepCounts = await slides.evaluateAll(elements => elements.map(
    slide => slide.querySelectorAll('[data-step]').length
  ))
  const slideCount = stepCounts.length
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.evaluate(() => Promise.all(Array.from(
    document.images,
    image => {
      if (image.loading === 'lazy') image.loading = 'eager'
      return image.decode().catch(() => {})
    }
  )).then(() => undefined))

  if (slideCount > 1 && !await page.evaluate(() => Boolean(document.startViewTransition))) {
    throw new Error('Use a Chromium browser with the View Transition API for animated GIF export.')
  }

  const { x, y, width, height } = await stage.boundingBox()
  const viewport = page.viewportSize()
  const clip = { x, y, width: Math.floor(width), height: Math.floor(height) }
  if (x < 0 || y < 0 || x + width > viewport.width || y + height > viewport.height) {
    throw new Error('The presentation stage must fit inside the export viewport. Try a smaller --width or adjust the deck CSS.')
  }

  let frame = 0
  const frameName = () => path.join(directory, `frame-${String(frame++).padStart(6, '0')}.png`)
  async function capture(milliseconds = 0) {
    const image = frameName()
    await page.screenshot({ path: image, clip })
    const copies = Math.max(1, Math.round(milliseconds * fps / 1000))
    for (let copy = 1; copy < copies; copy++) fs.linkSync(image, frameName())
    return image
  }

  const settled = () => page.waitForFunction(() => !document.documentElement.hasAttribute('data-df-transition'))
  async function navigate(key, slideIndex, revealCount) {
    await page.keyboard.press(key)
    await page.waitForFunction(({ slideIndex, revealCount }) => {
      const slides = document.querySelectorAll('[data-deckframe-ready] [data-stage] > [data-slide]')
      const slide = slides[slideIndex]
      return slide && !slide.hidden &&
        slide.querySelectorAll('[data-step]:not([hidden])').length === revealCount
    }, { slideIndex, revealCount })
    await page.waitForFunction(() => {
      if (!document.documentElement.hasAttribute('data-df-transition')) return true
      return document.getAnimations().some(animation =>
        animation.effect?.pseudoElement?.startsWith('::view-transition-group(')
      )
    })
  }

  async function sample({ still = false } = {}) {
    const duration = await page.evaluate(() => {
      const animations = [...new Set([
        ...document.querySelector('[data-stage]').getAnimations({ subtree: true }),
        ...document.getAnimations().filter(animation =>
          animation.effect?.pseudoElement?.startsWith('::view-transition')
        ),
        ...Array.from(document.querySelectorAll('[data-gif-overlay]')).flatMap(element => element.getAnimations())
      ])]
      const finite = []
      for (const animation of animations) {
        if (animation.playState === 'finished') continue
        animation.pause()
        if (Number.isFinite(animation.effect.getComputedTiming().endTime)) finite.push(animation)
        else animation.currentTime = 0
      }
      window.deckframeGifAnimations = finite
      return Math.min(2000, Math.max(0, ...finite.map(
        animation => animation.effect.getComputedTiming().endTime
      )))
    })

    if (!still) {
      for (let time = 0; time < duration; time += 1000 / fps) {
        await page.evaluate(position => {
          for (const animation of window.deckframeGifAnimations) animation.currentTime = position
        }, time)
        await capture()
      }
    }
    await page.evaluate(() => {
      for (const animation of window.deckframeGifAnimations) animation.finish()
      delete window.deckframeGifAnimations
    })
    await settled()
  }

  await sample({ still: true })
  let lastFrame = await capture(hold)
  async function advance(slideIndex, revealCount) {
    await navigate('ArrowRight', slideIndex, revealCount)
    await sample()
    lastFrame = await capture(hold)
  }
  for (const [index, count] of stepCounts.entries()) {
    if (index > 0) await advance(index, 0)
    for (let revealed = 1; revealed <= count; revealed++) await advance(index, revealed)
  }
  if (slideCount > 1) {
    // The runtime uses the outgoing slide's effect for backward navigation.
    // Use a crossfade for this export-only jump so the seam can retain matched morphs.
    await slides.last().evaluate(slide => { slide.dataset.transition = 'fade' })
    await navigate('Home', 0, 0)
    await sample()
  } else if (stepCounts[0] > 0) {
    await navigate('Home', 0, 0)
    await page.evaluate(({ clip, image }) => {
      const overlay = document.createElement('img')
      overlay.dataset.gifOverlay = ''
      overlay.src = image
      Object.assign(overlay.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: '2147483647',
        left: `${clip.x}px`, top: `${clip.y}px`,
        width: `${clip.width}px`, height: `${clip.height}px`
      })
      document.body.append(overlay)
      return overlay.decode().then(() => {
        overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, fill: 'forwards' })
      })
    }, { clip, image: `data:image/png;base64,${fs.readFileSync(lastFrame).toString('base64')}` })
    await sample()
  }
  return frame
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: 'string', default: '960' },
      'hold-ms': { type: 'string', default: '1250' },
      fps: { type: 'string', default: '20' },
      playwright: { type: 'string' },
      browser: { type: 'string' },
      help: { type: 'boolean' }
    }
  })
  if (values.help) {
    console.log(usage)
    return
  }
  if (positionals.length !== 2) throw new Error(usage)
  const [source, output] = positionals.map(filename => path.resolve(filename))
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error(`Deck not found: ${source}`)
  if (path.extname(output).toLowerCase() !== '.gif') throw new Error('The output path must end in .gif.')
  const fps = integer(values.fps, '--fps', 5, 30)
  const width = integer(values.width, '--width', 320, 1600)
  const hold = integer(values['hold-ms'], '--hold-ms', 100, 10000)
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  } catch {
    throw new Error('FFmpeg is required on PATH.')
  }
  let chromium
  try {
    ({ chromium } = require(values.playwright ? path.resolve(values.playwright) : 'playwright'))
  } catch {
    throw new Error('Playwright is required. Pass --playwright with the path to an available installation.')
  }

  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const executablePath = values.browser || (fs.existsSync(macChrome) ? macChrome : undefined)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'deckframe-gif-'))
  const encoded = path.join(directory, 'deck.gif')
  try {
    const browser = await chromium.launch({ executablePath })
    let frames
    try {
      const page = await browser.newPage({ viewport: { width, height: 2100 }, reducedMotion: 'no-preference' })
      frames = await captureDeck(page, source, directory, { fps, hold })
    } finally {
      await browser.close()
    }
    execFileSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-framerate', String(fps),
      '-i', path.join(directory, 'frame-%06d.png'),
      '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
      '-loop', '0', encoded
    ], { stdio: 'inherit' })
    fs.copyFileSync(encoded, output)
    console.log(`${output} (${(frames / fps).toFixed(2)}s, looping)`)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
