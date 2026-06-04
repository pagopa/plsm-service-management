# SMCR footer design

## Context

The `apps/sm-fe-smcr` Next.js application needs a legal footer matching the provided reference:

**PagoPA S.p.A.** - Società per azioni con socio unico - Capitale sociale di euro 1,000,000 interamente versato - Sede legale in Roma, Piazza Colonna 370,  
CAP 00187 - N. di iscrizione a Registro Imprese di Roma, CF e P.IVA 15376371009

The footer must appear across the whole application, including the authenticated dashboard shell, and should be implemented in a reusable way aligned with the existing project styling instead of copying Material UI classes from the source site.

## Goals

1. Show the legal text in all SMCR pages, including dashboard pages.
2. Keep the implementation reusable and easy to extend later.
3. Match the visual intent of the reference with existing Tailwind and project tokens.
4. Keep the footer pinned to the bottom when page content is short.

## Non-goals

1. Introducing a CMS, localization, or runtime configuration for the legal text.
2. Reworking the dashboard sidebar or page-level content layouts beyond what is needed for the footer.
3. Adding external UI libraries or copying source-site generated classes.

## Recommended approach

Create a dedicated `AppFooter` component with static legal copy and render it from the global app layout. Update the root page shell to use a vertical flex layout so the main content grows and the footer stays at the bottom of the viewport when content is sparse.

This is preferred over per-layout duplication because it keeps one source of truth for both markup and styling and guarantees consistent behavior across public and authenticated routes.

## Component design

### `AppFooter`

Add a reusable footer component under the SMCR component tree. The component will:

1. Render the legal copy as static text.
2. Emphasize `PagoPA S.p.A.` with stronger weight.
3. Use semantic footer markup.
4. Use Tailwind utility classes already consistent with the codebase.

Suggested structure:

- outer `<footer>` with light background and subtle top border / separation
- inner centered container with max width and horizontal padding
- legal paragraph centered, small text size, controlled line height
- manual line break enabled for medium screens and above, while mobile relies on natural wrapping

## Layout integration

### Root layout

Update `app/layout.tsx` so the body hosts the application inside a `min-h-screen flex flex-col` shell:

1. app providers and current children remain unchanged functionally
2. the content area becomes a flex item that grows
3. the new footer is rendered once, after the content area

This keeps the footer global without scattering imports across route layouts.

### Dashboard layout

The dashboard layout should continue to own the sidebar and authenticated content area. The footer remains outside the dashboard-specific shell and therefore spans the full available page width, matching the reference intent better than nesting it inside the sidebar inset content area.

Only minimal class adjustments are acceptable if required to preserve full-height behavior with the new global flex column.

## Visual behavior

The footer should stay visually simple and aligned with the screenshot:

1. light background
2. readable dark text
3. centered content
4. moderate vertical spacing
5. constrained reading width

Implementation should reuse project styling conventions such as `mx-auto`, `max-w-*`, `px-*`, `py-*`, `text-center`, and existing color tokens where appropriate. No Material UI class names or generated CSS should be ported.

## Responsive behavior

1. On mobile, the legal text wraps naturally and remains readable.
2. On medium and larger screens, a controlled `<br />` can reproduce the two-line appearance visible in the reference.
3. The footer must not overlap content or depend on fixed positioning.

## Error handling and risk management

This change has low technical risk. The main implementation concern is layout regression caused by introducing a new global flex container. To reduce that risk:

1. keep provider nesting unchanged
2. keep dashboard structure intact except for strictly necessary height/flex alignment adjustments
3. isolate footer styling inside the new component

## Verification

Confirm the final result in these scenarios:

1. a page with little content, to ensure the footer stays at the bottom
2. an authenticated dashboard page with sidebar, to ensure the footer still renders correctly
3. a narrow viewport, to ensure the legal copy wraps cleanly

## Implementation summary

Expected code changes are limited to:

1. add a new reusable footer component
2. wire the footer into the root layout
3. make the smallest layout adjustments needed to support bottom placement across the app
