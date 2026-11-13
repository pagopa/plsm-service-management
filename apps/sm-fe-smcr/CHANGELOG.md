# Changelog — sm-fe-smcr

## [0.10.0](https://github.com/pagopa/plsm-service-management/compare/sm-fe-smcr-v0.9.1...sm-fe-smcr-v0.10.0) (2026-11-13)


### Features

* **sm-fe-smcr:** [SMION-846] Come Frontend voglio creare uno specchietto in Dashboard delle Calls ([#414](https://github.com/pagopa/plsm-service-management/issues/414)) ([8054458](https://github.com/pagopa/plsm-service-management/commit/80544589c77b8f169fea734f42f058ebbc7c016c))
* **sm-fe-smcr:** [SMION-847] add database migration workflow ([#417](https://github.com/pagopa/plsm-service-management/issues/417)) ([985f6b7](https://github.com/pagopa/plsm-service-management/commit/985f6b7488d22695d01f37384c7309302180d0c2))
* **sm-fe-smcr:** [SMION-847] add database migration workflow ([#417](https://github.com/pagopa/plsm-service-management/issues/417)) ([bbf4201](https://github.com/pagopa/plsm-service-management/commit/bbf4201648857dd36e4b6feb8b32b3e412c89850))
* **sm-fe-smcr:** [SMION-929] Come DEV voglio aggiungere la paginazione lato FE delle calls in linea con l'api ([#421](https://github.com/pagopa/plsm-service-management/issues/421)) ([f816ce3](https://github.com/pagopa/plsm-service-management/commit/f816ce322c6e84924c7f1036e3134fe9f04298ae))
* **sm-fe-smcr:** [SMION-943] support FATAL logs and add Slack notifier ([#424](https://github.com/pagopa/plsm-service-management/issues/424)) ([43abd65](https://github.com/pagopa/plsm-service-management/commit/43abd656f32d686e4e3e33961c8be25347db08b2))
* **sm-fe-smcr:** improve log monitoring and structured logging ([#426](https://github.com/pagopa/plsm-service-management/issues/426)) ([216ace1](https://github.com/pagopa/plsm-service-management/commit/216ace1a09c8bdc0dbeb081a6abc28ac20e7d137))
* **sm-fe-smcr:** Ottimizzazione fuso orario Onboarding e stile pulsante download Contratto e dropdown superiore ([#425](https://github.com/pagopa/plsm-service-management/issues/425)) ([1a003fd](https://github.com/pagopa/plsm-service-management/commit/1a003fdb8ffbc08c4d42741c1ee5b778c910a909))

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
