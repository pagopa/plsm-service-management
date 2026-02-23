# SMCR VPN-Only Access Architecture

## Overview

This document describes the architecture implemented for `smcr.pagopa.it` to enable
VPN-only access while maintaining correct DNS resolution and SSL certificate validation.

## Architecture Components

### 1) Public DNS Zone (smcr.pagopa.it)

Purpose: keep NS delegation and enable managed certificate validation.

- NS delegation remains in the public DNS zone for `smcr.pagopa.it`
- A record at apex points to the App Service validation IP (no traffic routing)

### 2) Private DNS Zone (smcr.pagopa.it)

Purpose: internal resolution for VPN-connected users.

- Private DNS zone `smcr.pagopa.it` linked to the common VNet
- A record at apex points to the Private Endpoint IP

### 3) App Service Configuration

- Custom hostname binding for `smcr.pagopa.it`
- Azure managed certificate bound to the custom hostname
- App Service remains private (`public_network_access_enabled = false`)

### 4) Private Endpoint

- Private Endpoint for the App Service in the common PEP subnet
- Private DNS A record resolves to the PE IP when connected via VPN

## Traffic Flow

### Certificate Validation (Public DNS)

1. Azure validates `smcr.pagopa.it` via public DNS A record
2. Managed certificate is issued and bound to the App Service

### User Access (VPN)

1. VPN user queries `smcr.pagopa.it`
2. Resolution uses Private DNS zone and returns PE IP
3. Traffic flows through VPN to Private Endpoint
4. App responds with valid HTTPS using managed certificate

### External Access (No VPN)

1. DNS resolves via public zone
2. Public A record is only for certificate validation
3. App Service is private, so external access is denied (expected 403)

## Security Notes

- No public access on the App Service
- DNS public record is only for ACME validation and does not expose the app
- All real traffic uses the Private Endpoint via VPN

## Resource References

- App Service: `plsm-p-itn-fe-smcr-app-01`
- Private DNS Zone: `smcr.pagopa.it`
- Public DNS Zone: `smcr.pagopa.it` (NS delegation + validation A record)
- VNet: `plsm-p-itn-common-vnet-01`

## Validation

- Public (no VPN): `https://smcr.pagopa.it` returns 403
- VPN: `https://smcr.pagopa.it` is reachable
