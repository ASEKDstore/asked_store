# Changelog

All notable changes to this project will be documented in this file.

## [1.16.3] - 2024-12-19

### Performance & UI Improvements

- **Removed global performance-heavy effects:**
  - Removed global `transform: scale()` on all buttons/links to prevent layout thrashing in Telegram WebView
  - Removed global `animation: cardFadeIn` from `section > div` selector to prevent jank on list renders
  - Removed global `scroll-behavior: smooth` from `.app-scroll` (kept only `-webkit-overflow-scrolling: touch`)

- **Introduced design tokens (CSS variables):**
  - Typography tokens (font families, sizes, line-heights, letter-spacing)
  - Border radius tokens (lg/md/sm)
  - Color tokens (background, panel, stroke, text, muted, accent, danger)
  - Motion tokens (timing functions and durations)

- **Improved button interactions:**
  - Replaced `transform: scale()` with `opacity` transitions for better performance
  - Added `.btn` class for premium hover effects (only on devices with hover support)
  - Active state uses `opacity: 0.88` instead of scale

- **Card animations:**
  - Removed automatic animations from generic selectors
  - Added `.enter` class for explicit fade-in animations (320ms)
  - Prevents unnecessary animations on list items

- **Accessibility:**
  - Added `prefers-reduced-motion` support to disable animations for users who prefer reduced motion

### Technical Details

- All changes are backward compatible
- Visual appearance remains the same
- Performance improvements especially noticeable on Android Telegram WebView
- No breaking changes to component APIs

## [1.16.2] - Previous version

Previous stable version with full admin authentication system.

