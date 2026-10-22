# Changelog — sm-fe-smcr

## [0.9.1](https://github.com/pagopa/plsm-service-management/compare/sm-fe-smcr-v0.9.0...sm-fe-smcr-v0.9.1) (2026-10-21)


### Bug Fixes

* **sm-fe-smcr:** [SMION-892] refresh users after deletion ([#394](https://github.com/pagopa/plsm-service-management/issues/394)) ([5172ebb](https://github.com/pagopa/plsm-service-management/commit/5172ebbd87983d739afedc6ac14b97c7284542ac))

## [2026-05-12] - Global legal footer

### Added

- Added a reusable `AppFooter` component for the SMCR Next.js app
- Rendered the footer from the global app layout so it appears in public and dashboard routes
- Implemented the footer as a fixed element with shared content clearance so page content and sidebar items are not obscured

### Notes

- The legal copy follows the approved footer specs in `docs/superpowers/specs/2026-05-12-smcr-footer-design.md` and `docs/superpowers/specs/2026-05-12-smcr-footer-fixed-dashboard-design.md`
