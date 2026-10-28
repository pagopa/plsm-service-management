# Changelog — sm-fe-smcr

## [0.10.0](https://github.com/pagopa/plsm-service-management/compare/sm-fe-smcr-v0.9.1...sm-fe-smcr-v0.10.0) (2026-10-28)


### Features

* **sm-fe-smcr:** [SMION-846] Come Frontend voglio creare uno specchietto in Dashboard delle Calls ([#414](https://github.com/pagopa/plsm-service-management/issues/414)) ([8054458](https://github.com/pagopa/plsm-service-management/commit/80544589c77b8f169fea734f42f058ebbc7c016c))
* **sm-fe-smcr:** [SMION-847] add database migration workflow ([#417](https://github.com/pagopa/plsm-service-management/issues/417)) ([985f6b7](https://github.com/pagopa/plsm-service-management/commit/985f6b7488d22695d01f37384c7309302180d0c2))
* **sm-fe-smcr:** [SMION-847] add database migration workflow ([#417](https://github.com/pagopa/plsm-service-management/issues/417)) ([bbf4201](https://github.com/pagopa/plsm-service-management/commit/bbf4201648857dd36e4b6feb8b32b3e412c89850))

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
