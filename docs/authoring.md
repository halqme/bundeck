# Authoring Reference

This document is the reference for writing Bundeck presentations. For installation, CLI usage, and display controls, see the [User Guide](guide.md). For how Bundeck sizes and scales slide content, see [Layout Behavior](layout.md).

## Presentation structure

A Bundeck presentation is a Markdown file. Optional YAML frontmatter appears at the beginning of the file, and horizontal rules separate slides.

```markdown
---
title: Example Presentation
theme: default
aspectRatio: 16:9
fontSize: M
lang: en
---

# First slide

Content

---

# Second slide

More content
```

Generated HTML is an output artifact. Edit the Markdown source rather than editing generated HTML directly.

## Frontmatter

Bundeck accepts YAML frontmatter at the beginning of the document.

```yaml
---
title: Example Presentation
theme: dark
mode: auto
lang: en
aspectRatio: 16:9
fontSize: M
---
```

| Key           | Accepted value                | Behavior                                                                                           |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `title`       | String                        | Sets the generated HTML title. Defaults to `Untitled Presentation`.                                |
| `theme`       | Theme name                    | Selects a built-in theme. `default` and `dark` are built in. Unknown names fall back to `default`. |
| `mode`        | `light`, `dark`, or `auto`    | Stored as presentation metadata. Built-in theme selection is controlled by `theme`.                |
| `lang`        | Language tag                  | Sets the generated HTML `lang` attribute. Defaults to `en`.                                        |
| `aspectRatio` | Positive `width:height` ratio | Sets the slide design dimensions. Defaults to `16:9`. Invalid values fall back to `16:9`.          |
| `fontSize`    | `XS`, `S`, `M`, `L`, or `XL`  | Applies a global typography scale preset.                                                          |

## Slide boundaries

Use a Markdown horizontal rule (`---`) to end the current slide and begin the next one.

```markdown
# Slide one

Content

---

# Slide two

Content
```

A `---` inside the body is therefore a slide delimiter, not a decorative horizontal rule.

## Standard Markdown

Bundeck uses `marked` for Markdown parsing. Ordinary Markdown constructs can be used directly, including:

- headings
- paragraphs
- ordered and unordered lists
- blockquotes
- fenced code blocks
- tables
- links
- images

Prefer standard Markdown unless a Bundeck-specific construct is needed for presentation layout or styling.

## Class attributes

Bundeck can attach CSS classes to headings, inline spans, and images with `{...}` attributes.

### Headings

```markdown
# Centered title {.center}
```

### Inline spans

```markdown
This is [important]{.mark} and this is [secondary]{.muted}.
```

### Images

```markdown
![Diagram](diagram.png){.fit .opacity 80}
```

Multiple classes may be provided in one attribute block.

### Numeric class parameters

`opacity` and `gray` accept numeric parameters.

```markdown
![Image](image.png){.opacity 70 .gray 20}
```

The space-separated form above is converted to CSS classes such as `opacity-70` and `gray-20`. The explicit hyphenated forms also work:

```markdown
![Image](image.png){.opacity-70 .gray-20}
```

Values are clamped to the range `0` through `100`. When `opacity` or `gray` is used without a value, Bundeck uses `50`.

Built-in CSS provides opacity and grayscale classes in steps of 10. Prefer those values when using the built-in themes.

## Block containers

Use a colon fence to apply classes to a block.

```markdown
::: .caption .right
A right-aligned caption.
:::
```

Container fences use at least three colons. The opening fence must include a container name or one or more classes after whitespace.

```markdown
::: .center
Centered block content
:::
```

When nesting containers, use a longer fence for the inner container.

## Columns

Use a `columns` container with nested `col` containers.

```markdown
::: columns
:::: col

### Left

Left-column content
::::

:::: col

### Right

Right-column content
::::
:::
```

The inner fence is longer than the outer fence so Bundeck can parse the nested containers unambiguously.

Columns share the available width equally by default. Content inside a column remains ordinary Markdown.

## Speaker notes

A `speaker` container is removed from the audience-facing slide and rendered as presenter notes.

```markdown
# Result

The visible result goes here.

::: speaker
Mention the limitation before moving to the next slide.
:::
```

Speaker-note text does not contribute to the slide's content-density calculation.

## Built-in utility classes

These classes are provided by Bundeck's built-in styles.

| Category           | Classes                                       | Purpose                                                              |
| ------------------ | --------------------------------------------- | -------------------------------------------------------------------- |
| Alignment          | `center`, `left`, `right`                     | Text/block alignment                                                 |
| Vertical placement | `top`, `bottom`                               | Push content toward the top or bottom of a flex layout               |
| Text               | `caption`, `mark`, `muted`, `accent`, `small` | Common text treatments                                               |
| Block              | `block-center`, `overlay-dim`                 | Center a block or add a dim overlay treatment                        |
| Image              | `fit`, `cover`                                | Fit an image within available space or use it as a slide-cover image |
| Opacity            | `opacity-0` through `opacity-100`             | Set opacity in steps of 10                                           |
| Grayscale          | `gray-0` through `gray-100`                   | Apply grayscale in steps of 10                                       |

Custom class names are emitted into the generated HTML, but Bundeck does not create CSS rules for them automatically.

## Images

Ordinary Markdown images are supported.

```markdown
![Architecture](architecture.png)
```

Use `.fit` to constrain an image to the available slide area.

```markdown
![Architecture](architecture.png){.fit}
```

Use `.cover` when the image should cover the complete slide area.

```markdown
![Background](background.jpg){.cover}
```

Image source, alt text, and title attributes are escaped when rendered. Bundeck accepts relative URLs, `http` and `https` URLs, and `data:image/...` URLs. Other URL schemes are omitted.

### Relative assets

For a generated static HTML file, relative image URLs are resolved from the location of the generated HTML file.

When using `bundeck serve`, static files are served from the directory containing the input Markdown file.

## Tables and code

Tables and fenced code blocks use standard Markdown syntax.

````markdown
| Item | Value |
| ---- | ----: |
| A    |    10 |
| B    |    20 |

```typescript
const result = buildSlides(input);
```
````

Large tables and long code blocks can exceed the practical space available on one slide. Bundeck can reduce rendered text size, but it does not restructure content into multiple slides. See [Layout Behavior](layout.md).

## Complete example

```markdown
---
title: Project Update
theme: default
aspectRatio: 16:9
fontSize: M
lang: en
---

# Project Update {.center}

[September]{.accent} status

::: speaker
Open with the main result before discussing implementation details.
:::

---

## Results

::: columns
:::: col

### Completed

- Parser cleanup
- Presenter improvements
- Package verification

::::

:::: col

![Status diagram](status.png){.fit}

::: .caption .right
Current architecture
:::

::::
:::

---

## Takeaway

The release is [ready for validation]{.mark}.
```

## Authoring checks

After editing a presentation:

1. Build or serve the Markdown source with Bundeck.
2. Check the rendered slides, not only the Markdown source.
3. Check slides containing columns, images, tables, or long code blocks for overflow or excessive shrinking.
4. Fix the Markdown source when the rendered output is wrong; do not patch generated HTML as the primary solution.
