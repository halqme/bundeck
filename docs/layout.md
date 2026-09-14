# Layout Behavior

Bundeck applies several layers of sizing and scaling. This document explains what is automatic, what is not, and what authors should expect when a slide contains too much content.

For Markdown syntax, containers, classes, and speaker notes, see the [Authoring Reference](authoring.md).

## Overview

Bundeck does not use a single auto-layout algorithm. Layout is handled in stages:

1. The requested aspect ratio determines the slide's design dimensions.
2. The textual content length of each slide selects an initial slide font size.
3. An optional `fontSize` frontmatter preset scales theme typography.
4. In the browser, an overflowing slide can be scaled down further to fit vertically.
5. The complete slide canvas is scaled to fit a smaller browser viewport.

These mechanisms reduce overflow, but they do not rewrite, summarize, or split slide content.

## Slide design dimensions

The default design size is `1280 × 720`, corresponding to `16:9`.

The `aspectRatio` frontmatter value changes the design width while keeping a 720-pixel design height.

```yaml
---
aspectRatio: 4:3
---
```

Examples:

| Aspect ratio | Design dimensions |
| --- | ---: |
| `16:9` | `1280 × 720` |
| `4:3` | `960 × 720` |
| `1:1` | `720 × 720` |
| `21:9` | `1680 × 720` |
| `3:2` | `1080 × 720` |

Any positive `width:height` ratio is accepted. Invalid values fall back to `16:9`.

## Content-density sizing

During rendering, Bundeck estimates the amount of textual content on each slide and assigns an initial font size.

The current thresholds are:

| Text length | Density | Initial slide font size |
| ---: | --- | ---: |
| `< 100` characters | sparse | `32px` |
| `100–299` characters | normal | `24px` |
| `300–599` characters | dense | `18px` |
| `600+` characters | very dense | `14px` |

The content-length estimate includes text from common Markdown structures such as headings, paragraphs, lists, blockquotes, and code blocks.

Speaker notes are excluded because `::: speaker` content is separated from audience-facing slide content before the density value is calculated.

This is a heuristic based on textual length. It does not measure the final geometry of images, tables, or other elements at build time.

## `fontSize` presets

The optional presentation-level `fontSize` frontmatter key controls a theme typography scale.

```yaml
---
fontSize: M
---
```

Accepted values are `XS`, `S`, `M`, `L`, and `XL`.

The preset scales the theme's heading, body, and code sizes. It is separate from the per-slide content-density calculation described above.

If `fontSize` is omitted, Bundeck does not apply a preset class and uses the theme typography values directly. The current `M` preset uses a scale of `1`, so it is effectively neutral relative to the built-in theme defaults.

Do not use a smaller global preset as the first response to one overloaded slide.

## Runtime overflow scaling

After a slide is rendered in the browser, Bundeck measures its vertical content height.

If the content fits, the runtime text scale remains `1`.

If the content is taller than the available slide area, Bundeck reduces the slide text scale so that the rendered content fits vertically. The runtime does not scale below `0.4`.

The scale is recomputed when necessary, including after:

- slide changes
- viewport resizing
- orientation changes
- image loading
- font loading

This second pass is important because final browser geometry cannot always be predicted from Markdown text length alone.

## Viewport scaling

The slide itself has fixed design dimensions. When the browser viewport is smaller than those dimensions, Bundeck scales the complete slide container to fit the viewport while preserving the slide geometry.

The runtime uses the smaller of the available horizontal and vertical scale ratios and currently does not reduce the container scale below `0.7`.

This container scaling is distinct from text overflow scaling:

- text overflow scaling changes the scale of content inside one slide
- viewport scaling changes the displayed size of the whole slide canvas

## Columns

A `columns` container uses a horizontal flex layout. Columns share the available width equally by default.

```markdown
::: columns
:::: col
Left
::::
:::: col
Right
::::
:::
```

Each column has a minimum width of zero so long content is allowed to shrink within the flex layout rather than forcing the complete row wider than the slide.

Images inside columns are constrained to the column width. Code blocks may scroll horizontally when their contents are wider than the available column.

Bundeck does not automatically change the number of columns or move content between columns.

## Images

Normal images are constrained by the slide's available dimensions and use `object-fit: contain` by default.

`.fit` explicitly keeps an image contained within the available area.

`.cover` turns the image into a full-slide cover image positioned behind the slide content.

Image dimensions can materially affect the final rendered height, which is one reason runtime overflow scaling occurs after images have loaded.

## What Bundeck does not do

Automatic sizing is intentionally conservative. Bundeck does not:

- split an overloaded slide into multiple slides
- shorten prose or code
- remove list items
- change a two-column slide into another structure
- crop ordinary images to recover space
- infer which content is less important
- guarantee that a very dense slide remains comfortably readable

A slide that technically fits after aggressive shrinking can still be a poor presentation slide.

## Diagnosing a cramped slide

When a slide becomes unexpectedly small, check these causes in order:

1. **Too much textual content** — the build-time density heuristic may already have selected a smaller base size.
2. **Large rendered elements** — images, tables, code blocks, or nested content can increase the final height and trigger runtime scaling.
3. **Global `fontSize` preset** — an explicit preset changes typography throughout the presentation.
4. **Narrow aspect ratio** — changing the aspect ratio changes the available design width and can cause more line wrapping.
5. **Columns** — narrow columns increase wrapping and can make the slide taller even when the total text length is unchanged.

Prefer reducing or restructuring the content of the affected slide before globally reducing presentation typography.

## Practical authoring rule

Treat Bundeck's automatic scaling as overflow protection, not as a substitute for slide design.

After editing slides with dense text, columns, images, tables, or code, inspect the rendered output with `bundeck serve`. If a slide is only readable because it has been scaled down substantially, simplify that slide at the Markdown source level.
