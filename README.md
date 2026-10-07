# Fulmen — SaaS landing page + sign-up

Live: https://mowais2004.github.io/Fulmen/

https://github.com/user-attachments/assets/b18a8337-d21d-4394-82e0-b8717e31c14f


**Fulmen** (Latin for *lightning*) is a fictional SaaS: the **launch platform for independent clothing labels**. It runs the waitlist, the lookbook, the posts, the queue and the checkout for a product drop.

**The site in one sentence:** the hero *is* the Fulmen app, full screen on black, and every section after it speaks the same language. Glass "sunset" orbs drawn in WebGL follow your cursor. Rows and buttons are pills, panels look like app windows, and the dusk gradient (navy → lavender → peach → ember) is the only colour.

```
index.html  the landing page
  Loader      black screen, a dusk orb rises, counter 000 → 100, fades into the hero (once per tab)
  Hero        the app, full screen: in-window nav + "Ask Fulmen ⌘K" · headline + CTAs ·
              sunset orb (status) + silver orb (revenue) · pill rows: search, summary, All/Live/Upcoming, drops
  Ask Fulmen  ⌘K assistant card: search drops, typed answers, glow orb, chips
  Float nav   glass pill nav once the hero scrolls away
  01 What     rows of feature pills drift around a big orb; hover a pill → the orb explains it, in its colour
  02 Product  a dusk globe: orders fly from Leh to five cities, pills tick ✓, a live-orders feed fills
  03 Tools    five stacked cards (Drops, Lookbook, Social, Community, Brand kit) that pile up as you scroll
  04 Passes   a deck of sky-headed waitlist passes: drag the front one away, claim drops a new one in
  05 Studio   one campaign photo, a crop window that reshapes for each channel, export
  06 Live now a wheel of 16 cities turns past a small orb; the one at the orb shows its drop + local time
  07 How      four zigzag step cards joined by dashed paths that draw as you scroll + "Ready to launch?"
  08 Pricing  a tools row with a sun slider · plans in a tray (the cheapest becomes the dusk) · "Not sure?" banner
  09 FAQ      pill rows that open
  CTA         the orb at the centre of concentric rings + email form → start.html
  Footer      huge dusk-filled "Fulmen", link columns

start.html  sign-up ("Start free"): 3 steps (you → your label → first drop) with a live preview orb + pass
```

---

## Contents
1. [Run it](#1-run-it)
2. [Files](#2-files)
3. [Design system](#3-design-system)
4. [The orb (WebGL)](#4-the-orb-webgl)
5. [Sections in detail](#5-sections-in-detail)
6. [The sign-up page](#6-the-sign-up-page)
7. [Motion and smoothness](#7-motion-and-smoothness)
8. [Performance](#8-performance)
9. [Imagery and data](#9-imagery-and-data)
10. [Copy and the fictional world](#10-copy-and-the-fictional-world)
11. [How the code is organised](#11-how-the-code-is-organised)
12. [Responsive behaviour](#12-responsive-behaviour)
13. [Accessibility](#13-accessibility)
14. [Editing guide](#14-editing-guide)
15. [Testing checklist](#15-testing-checklist)
16. [Reference images and what came from each](#16-reference-images-and-what-came-from-each)
17. [History](#17-history)
18. [Credits](#18-credits)

---

## 1. Run it

It's a static site with no build step:

```bash
npx http-server fulmen -p 8180 -c-1
```

From the parent folder, `.claude/launch.json` also has an entry called **`fulmen`** on port **8180**. Open `/` for the landing page and `/start.html` for sign-up. After an update, press **Ctrl+Shift+R** so the browser drops cached files.

---

## 2. Files

| File | What it is |
|---|---|
| `index.html` | Landing page markup. The SVG sprite at the top holds the outlined bolt `#bolt` and the `#wireGrad` gradient used by the step icons and paths. |
| `start.html` | Sign-up page. |
| `style.css` | Shared styles: tokens, atoms, the orb, then every section in page order, then breakpoints. Used by both pages. |
| `start.css` | Only what is unique to the sign-up page (form fields, chips, swatches, stepper, plan picker, preview panel). |
| `main.js` | Shared behaviour, guarded so it runs on both pages: the frame loop, smooth scroll, loader, reveals, orbs (physics + WebGL), Ask Fulmen, globe, stack, passes deck, crop tool, city wheel, how-it-works paths, pricing, button sunrise, CTA. |
| `start.js` | Sign-up steps, validation, live preview, password strength. |
| `favicon.svg` | White outlined bolt on a dusk square. |
| `vendor/lenis.min.js` | Smooth scroll (Lenis), bundled. |
| `assets/land.js` | 4,247 land dots for the globe (lat/lon × 10), generated once from Natural Earth 110 m. |
| `assets/*.webp` | 12 photos (~970 KB). Every one is used. See [Imagery](#9-imagery-and-data). |

There are no frameworks and no npm dependencies at runtime.

---

## 3. Design system

### Tokens (`:root` in `style.css`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#000` | Page (the hero is the same black) |
| `--panel` | `#0b0b0d` | Section panels, stacked cards, tray, FAQ rows |
| `--card` | `#141416` | Cards inside panels (step cards, plans, tool previews) |
| `--panel-2` | `#161618` | Pill rows |
| `--panel-on` | `#39393c` | The highlighted pill row |
| `--text` / `--grey` | `#ececee` / `#8b8b91` | Text / secondary text (AA on every panel) |
| `--line` | 8% white | Hairlines and borders |
| `--gut` | `clamp(16px, 2.2vw, 32px)` | Side margin of every section |
| `--gap` | `clamp(104px, 12vw, 176px)` | **Space above every section** (and above the footer) |
| `--head` | `clamp(32px, 4vw, 56px)` | **Space between every section head and its content** |
| `--r` | `30px` | Panel radius |
| `--sky-*` / `--sun-*` | dusk, ember, ice, violet, silver | Orb palettes (sky gradient + core/rim/haze) |
| `--dusk-v` / `--dusk-h` | vertical / horizontal dusk | Best plan, duration pills, scheduled tags, slider track |

### Section rhythm
Every section is `<section class="sec">` (top padding `--gap`), then a `.sec-head` (label `NN — Name` on the left, statement on the right, bottom padding `--head`), then its content inset by `--gut`. So the gaps are identical everywhere, neither cramped nor loose.

### Type
- **Geist 400** for headlines and statements: sentence case, tracking −0.035 to −0.05 em. The last phrase is set in `<em>` and grey.
- **Geist 300** for big numbers (prices, globe stats, footer word).
- **Geist Mono** for labels (11 px uppercase), numbers in the UI and tags.
- **Pinyon Script** only as a customer's wordmark ("Nomad" in the brand-kit card).

### Shapes
- Everything you can click is a **pill** (999 px radius): buttons, rows, tabs, tags, inputs, FAQ rows.
- Panels have a 30 px radius. Cards inside them have 26–32 px. There are no hard borders, just a step lighter or darker.
- Icons are the **outlined bolt** (one stroke) and **line-art orbs** (wireframe spheres in `#wireGrad`).

### Buttons: the sunrise hover
On every `.pill` and the Ask chip, a dusk sun comes up on the **bottom edge, right under the cursor**, and grows until the pill shows the whole sky: ember at the horizon, through peach, mauve and lavender, to navy at the top. The text turns white. It follows the cursor along the edge and sinks back where you leave. (`::before` radial; JS sets `--bx`, `--by`, `--bs`.) Press = scale .97.

---

## 4. The orb (WebGL)

**Layers** (`.orb > canvas.orb-gl | .orb-fill + .orb-sun, .orb-body`, plus `::before` and `::after`):
- **Big orbs (> 120 px)** draw their gradient in **WebGL**, one small canvas each: the loader, the two hero orbs, the 01 feature orb, the Drops card orb, the CTA orb, and the sign-up preview orb.
- **Small orbs** (icons, swatches, plan dots, the wheel dot, pill dots) use the CSS layers, which are also the fallback when WebGL is unavailable, the context is lost, or reduced motion is on.
- `::after` is the glass: a 1 px rim, a top gloss, a bottom shade, and an inset light on the side facing the cursor. `::before` is a light spot under the cursor (silver orbs only).

**The shader** redraws the polished CSS gradient exactly: the same sky stops, the same three sun ellipses (core 31%×18%, rim 44%×28% from `#ff8d3f` to `#d9432b`, haze 85%×42%), and the same 18 s breathing. There's no noise texture, and a 1/255 dither stops banding.

**Interaction:**
- **The dark core follows the cursor.** It glides from its resting place low in the glass to wherever the pointer is, using a critically damped spring (frequency 7.5 rad/s, damping 1): smooth, with no wobble.
- As it rises it turns from a wide horizon sun into a smaller round one, and it stretches a little along its velocity.
- **It affects its surroundings:** the sky bands bend around it like light around a black hole, warm light spills into the sky nearby, and the ember rim warms as you approach.
- The whole sphere **leans** 3.5% of its radius toward the cursor.
- **Click/tap** sends a ripple through the glass and knocks the core back.
- On mouse, a **glass ring** (difference blend) replaces the cursor over big orbs.
- **Silver** is a white sphere lit by the cursor: its highlight drifts toward the pointer and its shade moves away.
- **Tone changes** (`tone-ember`, `tone-ice`, `tone-violet`, `tone-silver`) cross-fade smoothly by easing the palette uniforms.

---

## 5. Sections in detail

### Hero (`.hero`)
- **Full screen** (`100svh`, min 700 px), pure black. The `.window` grid fills it.
- **Nav row:** logo, links, the **Ask Fulmen ⌘K** chip, Sign in, Start free (→ `start.html`).
- **Left column:** the `h1` *"Your drop keeps selling, even while you sleep."*, a line of grey copy, and two pills.
- **Orbs:** size `--o = clamp(240px, min(34vw, 54svh), 540px)`.
  - The sunset orb shows a dotted spinner and a status line that cycles every 2.6 s.
  - The silver orb counts revenue up to $48,920.00 and sell-through to +96%.
- **Rows:** row height is `--o × .33`.
  - The tools row has a search button (opens Ask Fulmen), a summary pill ("96% sell-through, N drops") and **All / Live / Upcoming** tabs that collapse non-matching rows and update N.
  - Four drop rows run off the right edge, and the highlight moves to the next visible row every 2.4 s. Hovering a row takes over.
- `.win-main` has 24 px of extra room on its top and left, so the orbs can lean without being clipped.

### Ask Fulmen (`#ask`)
A black rounded card with close ✕ and expand ⤢ buttons, the answer in large type, suggestion chips, a dark **glow orb** whose light sliver stretches while it "thinks", and a speaker · input · send bar.
- It opens from the nav chip, the hero search button, the pricing "Ask Fulmen" banner, or **⌘K / Ctrl K**. Esc, ✕ or a backdrop click closes it, and focus goes back to where you were.
- Typing searches drops live. Clicking a result highlights that drop in the hero.
- Sending a question types out a canned answer (`REPLIES`: Drop 004, the hoodie restock, the hat, the overshirt, which plan fits).

### 01 — What it is (`#what`)
A panel with **six rows of pills drifting sideways**, alternating directions at 64–109 s per loop.
- Feature pills each carry a **tiny orb dot** in their tone. Empty "ghost" pills of varying widths sit between them, following the pill-wall reference.
- In the centre sits a big WebGL orb. **Hovering or focusing a pill pauses its row, lights the pill, and the orb takes the feature's colour and explains it.**
- There are 10 features: Drops, Waitlist, Lookbook, Scheduler, Community, Fair queue, Brand kit, Asset studio, Passes, Analytics.

### 02 — Product: one drop, everywhere at once (`#product`)
- **Globe** (left, `<canvas>`): drawn like a big dusk orb.
  - **Sphere:** a sky gradient from navy to a warm floor, dimmed, with an ember haze at the bottom, a top gloss, a white rim and a lavender halo.
  - **Land:** soft white dots, with the regions near Leh and each buyer brighter and warmer.
  - **Markers:** Leh and every buyer are **tiny gradient orbs**. Leh has a soft pulse ring.
  - **Orders:** gradient arcs run from Leh to London, Berlin, Nairobi, Lagos and Dubai. Every 8 s a soft comet flies each arc. When it lands, the marker lights and that city's **pill card ticks ✓** (the check is a dusk orb). Nairobi's card has a **tick-bar** shipping progress that fills to 54%.
  - **Movement:** it sways ±14° and you can **drag to spin** it, with inertia.
- **Side** (right):
  - A pill head ("Drop 004 · Nomad Supply · live") with a small orb.
  - Three stat pills: 40 countries, the order count (which goes up as orders land), and 18 currencies.
  - A **Live orders** feed: each landed order slides in on top in the buyer's currency, keeping the last four.

### 03 — Five tools (`#tools`)
Five **sticky cards that stack as you scroll** (stacked-cards reference). Each one sticks 16 px lower than the last, and as the next card arrives the one underneath **scales to 95% and dims** through a composited overlay.
- **Header:** a **lockup** in the card's colour (bolt + mono "FULMEN" + the tool name, after the NEXT reference) and a giant faint number (01–05, after the Foglamp reference).
- **Body:** a headline, tags, a sentence, and a **mini app preview** built from the hero's pieces:
  1. **Drops** (peach): a WebGL orb with a **live countdown** and pills for 4,812 waiting, 312 carts held and 5:00 to pay.
  2. **Lookbook** (ember): the campaign photo with a glass caption, plus a pill of look thumbnails and Publish.
  3. **Social** (ice): three scheduled-post pill rows with Scheduled (dusk) or Draft tags.
  4. **Community** (violet): overlapping fan faces, "312 tagged posts", and an **Approve** pill that works (count → 313).
  5. **Brand kit** (silver): five tone orbs and a type specimen ("Aa", Geist, "Nomad" in script).

### 04 — Waitlist passes (`#passes`)
- **Left:** one line, three fact pills and a name form.
- **Right:** a **deck** of passes with a soft dusk sun breathing behind it. There is no slot any more.
  - **Each pass:** a dark card with a **sky header in its label's tone** (Raw Arc violet, Tundra Club ice, Halfmoon ember, Nomad Supply dusk), with Queue #, Holder, Opens and a barcode.
  - **Drag the front pass sideways:** past 28% of its width it flings off and tucks in at the back of the deck. Below that it springs back. It tilts as you drag.
  - **Tap a pass behind** (they lift on hover) and it comes to the front. Keyboard: Enter.
  - **Tilt:** the front pass tilts toward the cursor with a sliding holographic dusk sheen.
  - **Claiming:** typing a name previews it on the front Nomad pass, and **Claim pass** drops a new numbered pass (#0002…) in from above. The deck keeps five.

### 05 — Asset studio (`#studio`)
- **Left:** the Pangong Tso campaign photo. A **crop window** (rule-of-thirds lines, corner brackets, the outside dimmed) reshapes and slides for each format, with a glass tag such as `9:16 · 1080 × 1920`.
- **Right:** five format pill rows: Instagram feed 4:5, Stories & TikTok 9:16, Grid 1:1, Web banner 16:9, Product page 2:3. It auto-advances every 2.8 s (pausing on hover), and you can click to pick.
- **Export:** "1,240 assets from one shoot", a tick bar and **Export all**, which fills the bar and confirms (demo).

### 06 — Live now (`#live`)
- **Wheel:** 16 cities on an arc around a **small orb**. It turns one step every 2.6 s and pauses on hover. Click a city or use ↑↓.
- **Card:** the city at the orb shows its **real local time** (`Intl.DateTimeFormat`), the label, product, % sold and queue in a pill row.

### 07 — How a drop runs (`#process`)
From the fitness-steps and "How does it work" references.
- **Four step cards in a zigzag:** Plan (30 days out), Tease (7 days out), Drop (launch hour), Recap (next morning).
- **Each card:** a **vertical duration pill**, a **line-art orb icon** (wireframe sphere, stacked ellipses, triple ellipses, concentric circles in `#wireGrad`), a numbered title and a sentence.
- **Dashed paths** join the cards (right, then down with a rounded corner, ending in an arrowhead). They **draw in as you scroll** past a line 62% down the screen. When a path reaches a card, it lights up: its duration pill fills with dusk, the icon brightens and the border shows.
- **Ready row:** a hairline, then "Ready to launch your *first drop?*" with a round dusk-orb arrow and **Get started** (→ `start.html`).

### 08 — Pricing (`#pricing`)
- **Head:** label, statement, and a Monthly / Yearly −20% pill toggle.
- **Tools row** (built like the hero's): an orb, a pill with "What do you sell in a month?" and a live number, and a pill holding a **horizon slider**. The track is the dusk gradient, the thumb is a small dusk orb, and the scale is logarithmic from $0 through $1k and $10k to $100k.
- **Tray** (after the "Built for growth" reference): three plan cards in a rounded tray.
  - **Each card:** a tone orb, name and line, the price, "At your volume $X a month, all in" (base + fee × sales), and five **feature pill rows** (drops a month, waitlist size, fee per sale, seats, asset crops) after the Foglamp table.
  - **The cheapest plan at your volume becomes the sunset:** it fills with dusk, lifts 6 px, gets a **Best for you** chip and a light button. The break-evens are $2,450 (Studio → Label) and $15,000 (Label → House).
- **Banner:** an animated dusk-aurora strip with an orb: "Not sure which plan fits?" and a black **Ask Fulmen** pill that opens the assistant.

### 09 — Questions (`#faq`)
Five `<details>` pill rows, auto-numbered. The row gets lighter on hover and when open, and `+` turns to `−`.

### CTA (`#start`)
After the concentric-rings reference.
- **Layout:** a black panel with six concentric rings (fading borders, embossed shading) and a pulse ring that expands from the centre every 5 s, all around a WebGL orb. A warm dusk glow rises from the bottom edge.
- **Content:** "Your next drop *starts here.*" and an email pill form.
- **Submitting** stores the email in `sessionStorage` (never the URL) and opens `start.html` with it filled in.

### Footer
A huge light "Fulmen" with the dusk gradient clipped into the letters, a services line, three link columns and the legal line.

---

## 6. The sign-up page

`start.html` reuses `style.css` and `main.js` (orbs, pills, sunrise hover, smooth scroll) and adds `start.css` + `start.js`.
- **Layout:** the form on the left and a **sticky dusk preview panel** on the right (stacked below on phones). The top bar has the logo, a **progress bar that fills with the dusk gradient**, and "Step n of 3".
- **Step 1 · You:** name, work email, and password with a show/hide eye and a **strength meter that fills like a small horizon** (Too short → Okay → Good → Strong → Great).
- **Step 2 · Your label:** label name, "What do you make?" chips, and **"Pick your sky"**: five orb swatches that recolour the preview orb and pass.
- **Step 3 · First drop:** product, date (defaults to next Thursday, no past dates) and time (18:00), a −/+ units stepper, and plan cards (the chosen one fills with dusk).
- **Done:** "You're in, {name}." with three ✓ rows: the waitlist URL, passes from #0001, and "setup link sent to {email}". **Back to home** / **Start over**.
- **Live preview:** the URL pill (`fulmen.app/{label-slug}`), the WebGL orb with the label name and "{product} · {units} units", and the waitlist pass. It updates on every keystroke.
- **Handoff:** every homepage start button links here. Plan buttons add `?plan=studio|label|house` to pre-select the plan, and the CTA email arrives through `sessionStorage`.
- **Validation and data:** native rules, shown Fulmen's way (an ember ring, a short message, focus on the problem). Nothing is sent anywhere; it's a demo.
- The how-it-works cards use `.how-step`, so they never clash with the sign-up `.step` fieldsets.

---

## 7. Motion and smoothness

- **One loop.** A single `requestAnimationFrame` runs Lenis, reveals, the float nav and every registered tick: orbs, WebGL, globe, stack, deck, wheel, how-paths.
- **Time-based, frame-rate independent.** Each tick gets `dt` (seconds, capped at 50 ms). Springs are integrated with `dt`, and every ease uses `ease(rate, dt) = 1 − (1 − rate)^(dt·60)`. *Previously everything was per-frame, so on 120/144 Hz screens it ran 2–2.4× too fast and looked jittery; that was the "too fast" feeling.*
- **The orb spring is critically damped** (no overshoot), so the core glides instead of wobbling.
- **Easing:** `cubic-bezier(.2,.7,.1,1)` for every CSS transition.
- **Reveals:** statements rise word by word out of a 6 px blur (26 ms stagger). Panels marked `data-reveal` rise 40 px and fade in.
- **Hover rule:** only the hovered thing changes. Nothing else dims.

---

## 8. Performance

Measured by scrolling the whole page top to bottom in 9 s on the dev machine (headless Edge, RTX 3060 laptop; the headless browser was capped near 34 fps, so script cost was measured directly):
- **Script work averages 0.36 ms per frame** (a 144 Hz frame has 6.9 ms). The heaviest task, the globe, peaks around 5 ms under that throttle.

What keeps it there:
- **Layout is read once per frame.** Watched elements are measured at the start of the frame (`R(el)`) before any tick writes a style. This avoids forced reflows. Reveals also read first, then write.
- **WebGL:**
  - Only orbs wider than 120 px get WebGL: six at most on the landing page, well under the browser's 16-context limit.
  - They're **prepared in idle time after load** (shader compiled, canvas sized, first draw), never mid-scroll. Before this, a first compile caused an ~87 ms hitch.
  - They render at ~0.6× resolution, only near the viewport.
  - Their canvas size comes from a **ResizeObserver**, not the on-screen rect. The stacked card's scale used to reallocate the Drops orb's canvas every frame (a 36 ms task, now 0.2 ms).
- **Globe:**
  - Land dots are **bucketed into 26 colour/depth groups** and each is filled once, about 26 fills per frame instead of about 4,000.
  - Markers are **pre-rendered sprites** (no per-frame shadows), and the halo and gradients are cached on resize.
  - Card sizes are cached by ResizeObserver.
- **Stacked cards:** dimmed with an **overlay's opacity**, not a filter (no repaint). Sticky offsets and heights are measured on resize only, and they write only when the value changes.
- **City wheel:** stops writing transforms once it has settled.
- **CSS:**
  - Breathing animations run only on big CSS-fallback orbs.
  - Blurred drifting layers (deck glow, aurora, pill rows) are promoted with `will-change: transform`, so they're rasterised once.
  - The moving globe cards have no backdrop blur.
- **Assets:** 12 WebP photos (~970 KB, lazy-loaded below the hero) and `land.js` (37 KB). There are no fonts beyond Geist, Geist Mono and Pinyon Script.

---

## 9. Imagery and data

All photos are free-licence Unsplash images, converted to WebP with ffmpeg. They show the same fictional customers.

| File | Used in | Unsplash id |
|---|---|---|
| `denim.webp` | Hero row 1, Live now (Leh) | `1614693348454-1e0710d21c60` |
| `lookbook.webp` | Hero row 2, Lookbook card, Live now (Seoul) | `1633677263781-610f76009206` |
| `crew-1…4.webp` | Hero row 3, globe cards + feed, Social/Community cards, Live now | `1617883054345-cb350d20ece8`, `1617883046873-5b79869cae8e`, `1617883020390-84fd4b155190`, `1617883088595-174698cd1a8b` |
| `sku-1…4.webp` | Hero row 4, Lookbook card, globe, Live now | `1644959713434-f6241e4284ec`, `1669266586576-639523db9306`, `1640547639086-a810d03f76a8`, `1652823766737-86f1aa04f768` |
| `closeup.webp` | Social card, Live now (Copenhagen) | `1649018282890-d0593f7b0989` |
| `location.webp` | Asset studio, Social card | `1593118845043-359e5f628214` |

Data that lives in `main.js`: `STATUS` (hero orb lines), `FEATURES` (01 pills), `BUYERS` (globe), `CITIES` (wheel), `REPLIES` (assistant). Palettes are in `PAL`. `land.js` was generated from `world-atlas` (Natural Earth 110 m) by sampling a 1.6° grid with `d3-geo`.

---

## 10. Copy and the fictional world

- **Fulmen Labs**, "made between Leh and Lisbon".
- **Nomad Supply:** Drop 004, a raw denim jacket shot at Pangong Tso. It took $48,920, sold out in 11:04, and pass #0001 belongs to Tenzin D.
- **Other labels:** Halfmoon (wide-brim hats), Tundra Club (fleece), Raw Arc (selvedge), Saltwork, Oxbow, Vesper, Kontor, Northline, Praia and more, all invented.
- **Tone:** calm, short, confident. Sentence case everywhere except the mono labels.

---

## 11. How the code is organised

`main.js`, top to bottom:
1. **Helpers:** `$`, `$$`, `clamp`, `ease`, and the `ticks` list with `watch`/`R` (once-per-frame layout reads).
2. **Lenis + anchor links.**
3. **Loader:** it plays once per tab; `startHero()` is called a frame later.
4. **Statement word-splitting.**
5. **Hero:** count-up, status cycle, row cycle, filter tabs.
6. **01 pill wall:** generated rows; hover → orb tone and text.
7. **The frame loop:** read layout → reveals → ticks.
8. **Orbs:** spring physics plus CSS variables, then the WebGL renderer (shader, palettes, idle warm-up, per-frame draw).
9. **Ask Fulmen.**
10. **Globe:** projection, buckets, arcs, comets, sprites, cards, feed.
11. **Tool stack:** scale/dim, Drops countdown, Approve.
12. **Pass deck:** layout, drag-to-back, tap-to-front, tilt/sheen, claim.
13. **Asset studio crop.**
14. **City wheel.**
15. **How-it-works paths:** an SVG mask per path for the draw-in.
16. **Pricing calculator.**
17. **Button sunrise.**
18. **CTA → `start.html`.**

Every section is guarded (`if (el)`), so the same file runs on `start.html`. State classes in use: `.in`, `.on`, `.show`, `.hide`, `.done`, `.best`, `.front`, `.live`, `.dragging`, `.incoming`, `.gone`, `.swap`, `.gl`, `.big`, `.thinking`, `.open`, `.wide`.

---

## 12. Responsive behaviour

| Width | Changes |
|---|---|
| ≤ 1100 px | The hero nav links hide. The globe and its side stack. Tool cards stack their copy above the preview. The pricing tools row wraps (the orb hides, and the slider takes a full row). |
| ≤ 900 px | Passes, the crop tool and the plan tray become one column. Step cards lose the zigzag. |
| ≤ 760 px | **Hero:** the hero stacks (nav → headline → 64 vw orbs → tabs + rows); the Ask chip becomes a search circle; the float nav shows the logo + Start free. **Sections:** section heads stack; tool cards stick 10 px apart; the wheel arcs near the top with its card at the bottom; the how-paths hide; the footer has 2 columns. |

Checked at 1440×900, 1024×768 and 390×844. Nothing overflows horizontally on a phone.

---

## 13. Accessibility

- Landmarks, one `h1`, an `h2` per section, real `<button>`s, `<details>` and form labels.
- **Keyboard:**
  - Pills in the 01 wall are focusable, and focusing one explains it. The duplicated loop copies are `aria-hidden` and `tabindex=-1`.
  - The pass deck works with Enter.
  - Wheel cities are focusable buttons.
  - ⌘K / Esc work for the assistant.
- **Screen readers:**
  - `aria-live` on the orb status, the feed, the assistant answer and the wheel card.
  - `aria-pressed` on toggles and `aria-selected` on crop formats.
  - The globe canvas has a text `role="img"` label.
- **Reduced motion:** no loader, no auto-cycling, no drifting, no WebGL or physics, instant transitions.
- `:focus-visible` outlines everywhere. Secondary grey is AA on every panel.

---

## 14. Editing guide

| To change… | Edit |
|---|---|
| Colours / spacing rhythm | `:root` tokens in `style.css` (`--gap`, `--head`, `--gut`) |
| Orb palettes | `--sky-*`/`--sun-*` in CSS **and** `PAL` in `main.js` (WebGL) |
| Orb feel | in `main.js`: spring `W`/`Z`, lean `.035`, stretch `.05`/`.12`; in the shader: follow `hov*1.15`, sky bend `.7`/`.04`, warm spill `.32` |
| Which orbs use WebGL | the `120` px threshold in `main.js` |
| Hero headline / rows | `.win-side h1`, `.row-drop` blocks |
| Feature pills | `FEATURES` (name, sentence, tone) |
| Globe buyers | `BUYERS` (lat, lon, card city, card side, feed entry) and `ORIGIN` |
| Tool cards | the `.tool-card` articles (`--c` = lockup colour) |
| Passes | `.pass` buttons in `#deckCards` (`tone-*` for the sky) |
| Crop formats | `#cropList` buttons (`data-r`, `data-x`, `data-px`) |
| Cities | `CITIES` |
| Steps | the `.how-step` items |
| Prices / features | `data-m`/`data-y` on `.amount b`, `data-fee` on `.plan`, the `.feat` rows |
| Assistant | `REPLIES`, `#askChips` |
| Sign-up | `start.html` fieldsets; `render()` and the submit handler in `start.js` |

---

## 15. Testing checklist

- [ ] Loader plays once; a reload in the same tab skips it; scrolling works either way.
- [ ] Hero orbs: the core glides to the cursor without wobble; the rim warms; click ripples; the glass-ring cursor shows; motion feels the same on 60 Hz and 144 Hz.
- [ ] Hero rows cycle; tabs filter; ⌘K opens Ask Fulmen and the chips answer.
- [ ] 01: rows drift; hovering a pill pauses its row and the orb changes colour and text.
- [ ] 02: comets fly, markers light, pill checks turn dusk, the shipping bar fills, the feed adds orders and the count rises; drag spins the globe.
- [ ] 03: cards stack; the one underneath scales and dims; the countdown ticks; Approve toggles.
- [ ] 04: dragging the front pass sends it to the back; tapping a back pass brings it forward; Claim drops in #0002 with your name.
- [ ] 05: the crop window reshapes; Export fills the bar.
- [ ] 06: the wheel turns, pauses on hover, and shows the right local time.
- [ ] 07: the dashed paths draw in on scroll and each step lights when its path arrives.
- [ ] 08: dragging the sun changes the totals and moves "Best for you" (Studio < $2,450 < Label < $15,000 < House); Yearly lowers the bases; the banner opens Ask Fulmen.
- [ ] CTA: rings and pulse; the email carries over to `start.html`.
- [ ] Sign-up: errors, live preview, swatches, stepper, `?plan=` preselect, done screen.
- [ ] 390 px: no sideways scroll anywhere.

---

## 16. Reference images and what came from each

| Reference | Became |
|---|---|
| Giza app shot | The hero: the app in a black window, sunset + silver orbs, pill rows |
| Concentric rings + "invite" card | The CTA rings |
| Pill wall ("Culturelle, Extérieure…") + Equator vertical pills | 01's drifting pill rows |
| "Globally, without the hassle" globe | 02's globe with user cards and progress bar |
| Stacked "Marketing Campaigns / 3D Visualization" cards | 03's sticky stacked tool cards |
| NEXT Academy / Store / Solutions lockups | The tool-card lockups (coloured bolt + FULMEN + name) |
| Foglamp pricing (giant "1", feature table) | Giant faint card numbers; plan feature rows |
| "Built for growth" pricing (tray, gradient banner) | The plan tray and the "Not sure?" aurora banner |
| Fitness steps (vertical duration pills, dashed connectors) | 07's zigzag steps |
| "How does it work" (line-art orb icons, "Ready to…" row) | 07's wireframe icons and Ready row |
| Ticket passes / city wheel / voice assistant (earlier rounds) | 04 passes, 06 Live now, Ask Fulmen |

---

## 17. History

1. **v1, "Brkthru" board:** white streetwear editorial.
2. **v2:** a film-credits hero.
3. **v3, "Giza":** a dark dusk theme with glass orbs and pills.
4. **v4:** a full-screen hero, Ask Fulmen, filter tabs, passes and the Live now wheel.
5. **v5:** the globe and the crop tool. The orb interaction became "a sun in a glass".
6. **v6:** sunrise buttons, a full-gradient globe, wallet passes and horizon pricing.
7. **v7:** the sign-up page.
8. **v8:** WebGL orbs, first noisy, then the polished gradient with a cursor-following core.
9. **v9 (current):** made the **whole site feel like the hero**.
   - **Motion:** fixed the jitter (everything is now time-based with critically damped springs).
   - **Rebuilt sections:**
     - **01:** the pill wall.
     - **02:** the globe as a dusk orb with orb markers and pill cards, plus a live feed.
     - **03:** the new stacked tool cards.
     - **04:** a draggable pass deck, with the slot removed.
     - **07:** zigzag steps with drawing paths.
     - **08:** pricing as a tools row, tray and aurora banner.
     - **CTA:** the rings.
   - **Spacing:** one section rhythm.
   - **Cleanup:** the stylesheet and script were rewritten without dead code, the unused photo was removed, and the whole page was profiled and optimised (see §8).

---

## 18. Credits

- Fonts: Geist and Geist Mono (Vercel, OFL), Pinyon Script (OFL), via Google Fonts.
- Smooth scroll: Lenis (MIT).
- Map data: Natural Earth via `world-atlas`, sampled with `d3-geo` and `topojson-client` (used only at build time).
- Photography: Unsplash contributors under the Unsplash licence (ids above).
- Layout ideas: the client's reference images listed in §16 (reference only, nothing copied).
