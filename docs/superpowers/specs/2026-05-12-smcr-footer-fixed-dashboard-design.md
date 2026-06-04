# SMCR fixed dashboard footer design

## Context

The first SMCR footer iteration added a reusable legal footer and rendered it globally, but in the authenticated dashboard the visible result is not aligned with the updated requirement:

1. the footer background does not span the full browser width under the sidebar
2. the footer is not fixed to the bottom of the viewport

The requested revision applies specifically to the logged-in experience and must keep the footer visible at the bottom of the browser, full-width, while preserving the project visual language.

## Goals

1. Keep the footer always visible at the bottom of the viewport in the logged-in dashboard.
2. Make the footer background span the full browser width, including below the sidebar area.
3. Keep a single global footer implementation without duplicating it inside dashboard layouts.
4. Preserve the SMCR font family while making the footer typography closer to the visual reference through sizing, weight, and spacing.

## Non-goals

1. Replacing the project font family with Material UI or external site-generated styling.
2. Duplicating footer markup inside the dashboard shell.
3. Reworking unrelated dashboard layout structure beyond what is required for footer placement and content clearance.

## Recommended approach

Keep `AppFooter` mounted once from the root layout, but change it from a normal flow footer to a fixed viewport footer:

1. `AppFooter` becomes `fixed` on the bottom edge of the viewport with `inset-x-0`
2. the footer background spans edge-to-edge across the browser width
3. the inner content remains constrained in a centered container for readability
4. the authenticated shell receives bottom spacing equal to the footer height so page content is not hidden behind the fixed footer

This is preferred over putting the footer inside the dashboard layout because the requirement is inherently viewport-level and full-width. The root layout is the correct ownership boundary.

## Component design

### `AppFooter`

The footer remains a focused component with one responsibility: render the legal bar.

Revised visual behavior:

1. full-width fixed bar at the bottom of the viewport
2. subtle top border and solid background to clearly separate it from page content
3. centered text container with constrained max width
4. legal text styled using the app font with improved weight, size, and spacing to better match the reference look
5. `PagoPA S.p.A.` stays visually emphasized

Responsive text behavior remains simple:

1. controlled line break for larger screens
2. natural wrapping for smaller screens

## Layout integration

### Root layout

The root layout remains the single integration point for the footer.

Responsibilities:

1. keep provider nesting unchanged
2. keep the main app shell above the footer
3. render `AppFooter` once, globally

Because the footer becomes fixed, the root shell should not rely on the footer to consume document flow height.

### Dashboard layout

The dashboard layout remains footer-agnostic. It should only reserve enough bottom space so authenticated content can scroll fully above the fixed footer.

This means:

1. no duplicate footer in the dashboard layout
2. minimal bottom padding or spacing in the dashboard content shell
3. no coupling between sidebar logic and footer logic

## Visual behavior

The updated footer should look closer to the reference while staying native to SMCR:

1. full browser-width bar
2. centered legal text block
3. project font retained
4. tighter, cleaner caption-like rhythm through class tuning rather than font replacement

## Risk management

Main risks:

1. content hidden behind the fixed footer
2. double spacing or conflicting spacing between root shell and dashboard shell
3. footer visually overlapping mobile content if the reserved space is too small

Mitigation:

1. reserve explicit bottom space in the authenticated shell
2. keep footer ownership only in the root layout
3. verify both short and long dashboard pages

## Verification

Confirm the revision in these scenarios:

1. logged-in dashboard page: footer is fixed and visible
2. browser full width: footer background spans below the sidebar and reaches both viewport edges
3. long page content: last content is still reachable and not covered by the fixed footer
4. narrow viewport: text remains readable and wraps correctly

## Implementation summary

Expected code changes are limited to:

1. revise `AppFooter` styling for fixed full-width behavior
2. adjust root layout and/or dashboard shell spacing for content clearance
3. update or add tests covering fixed global integration behavior
