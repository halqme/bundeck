---
title: Bundeck Feature Overview
author: Bundeck Development Team
theme: default
aspectRatio: 16:9
fontSize: M
---

# Bundeck {.center}

**Zero-Config Slide Generator**
Create beautiful slides automatically with just Markdown.

::: .center
[Get Started Now]{.mark}
:::

::: speaker
This is the opening slide.
Bundeck is a slide creation tool that requires no configuration to get started.
:::

---

## 🚀 Key Features

- **Markdown-based**: Create content with familiar syntax
- **Automatic layout**: Automatically adjust font sizes to fit the amount of content
- **Flexible extensions**: Supports custom classes and column layouts
- **Fast builds**: Generate HTML quickly with the power of Bun

---

## 🎨 Typography and Styling

In addition to standard Markdown, you can specify attributes.

### Inline Styles
You can [highlight]{.mark} specific words or add an [accent]{.accent}.

### Paragraph Styles
::: .center
This paragraph is centered.
:::

::: .caption .right
This paragraph is a right-aligned caption.
:::

::: speaker
Use the `{.class}` format to specify attributes.
:::

---

## 📊 Two-Column Layout {.center}

Use the `::: columns` container to divide the screen.

::: columns
:::: col
### Left Column
- Bullet points
- Content organization
- Visual separation
::::

:::: col
### Right Column
```typescript
// Code is displayed cleanly
const slide = new SlideBun();
slide.build("presentation.md");
```
::::
:::

---

## 🖼️ Image Handling {.center}

You can fit images to the slide or apply filters.

![Demo Image](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80){.fit .opacity 80}

::: .caption
The `{.fit}` class keeps an image within the frame, while `{.opacity 80}` adjusts its opacity.
:::

---

### 🎭 Background Image (Cover) {.overlay-dim}

![Cover Background](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80){.cover}

::: .overlay-dim
Using the `{.cover}` class displays an image full-screen as a background.
:::

## Slide with a Background {.center .overlay-dim}

::: .center .overlay-dim
Visually striking slides are easy to create.
:::

---

## 📝 Speaker Notes

The `::: speaker` block lets you create notes visible only to the presenter.

- Presenter cues
- Detailed supplementary information
- Hidden instructions

::: speaker
This content is not displayed on the slide itself.
You can view it in presenter mode.
:::

---

## 📅 Tables

Standard Markdown tables can be used for data comparisons and lists.

| Feature | Bundeck | Other Tools |
| :--- | :---: | :---: |
| Setup effort | Zero | Required |
| Build speed | Lightning fast | Average |
| Flexibility | High | Limited |

---

## 🏁 Summary

With Bundeck, you can spend less time worrying about design and focus on **“getting your message across.”**

### Next Steps
1. Build with `bundeck my-slides.md`
2. Preview with `bundeck serve my-slides.md`

::: .center
[Happy Presenting!]{.mark}
:::
