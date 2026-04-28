# PLSM Service Management

> **Modern monorepo for PagoPA Service Management platform** — Frontend, Azure Functions, and shared packages powered by Turborepo

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black) ![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white) ![Yarn](https://img.shields.io/badge/Yarn-4.x-2C8EBB?style=flat-square&logo=yarn&logoColor=white) ![Azure Functions](https://img.shields.io/badge/Azure%20Functions-v4-0062AD?style=flat-square&logo=azurefunctions&logoColor=white) ![Terraform](https://img.shields.io/badge/Terraform-1.x-7B42BC?style=flat-square&logo=terraform&logoColor=white) ![Azure](https://img.shields.io/badge/Microsoft%20Azure-italynorth-0089D6?style=flat-square&logo=microsoftazure&logoColor=white)

---

## 📖 Overview

**PLSM Service Management** is a comprehensive monorepo that brings together all microservices, frontend applications, and shared libraries for the PagoPA Service Management platform. Built with Turborepo and managed through Yarn workspaces, this repository provides a unified development experience covering multiple Azure Functions, a Next.js frontend, and shared configurations.

The platform handles critical operations including authentication flows, CRM integration with Dynamics 365, contract onboarding, certification processing, and the Service Manager Control Room (SMCR) dashboard.

---

## 🏗️ Monorepo Structure

### Applications

| Application             | Type                  | Description                                              |
| ----------------------- | --------------------- | -------------------------------------------------------- |
| **sm-fe-smcr**          | Next.js 15 + React 19 | Main application frontend - Service Manager Control Room |
| **sm-auth-fn**          | Azure Function v4     | MSAL OAuth2 PKCE authentication service                  |
| **sm-ask-me-fn**        | Azure Function v4     | "Ask Me Anything" chatbot with Slack integration         |
| **sm-certification-fn** | Azure Function v4     | XML certification processing with PostgreSQL storage     |
| **sm-crm-fn**           | Azure Function v4     | Dynamics 365 CRM integration                             |
| **sm-onboarding-fn**    | Azure Function v3     | Contract onboarding with Kafka event streaming (legacy)  |
| **sm-pf-fn**            | Azure Function v4     | Personal data management with secure blob storage        |

### Shared Packages

| Package               | Description                                   |
| --------------------- | --------------------------------------------- |
| **eslint-config**     | Shared ESLint configurations for code quality |
| **typescript-config** | Shared TypeScript compiler configurations     |
| **ui**                | Shared UI component library (in development)  |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Yarn** 4.x (Berry)
- **Terraform** 1.x (for infrastructure management)

### Installation & Commands

```bash
# Install dependencies
yarn install

# Build all apps and packages
yarn build

# Start development servers
yarn dev

# Run linters
yarn lint

# Type check all workspaces
yarn check-types

# Format code
yarn format
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/monorepo/` directory:

- **[Monorepo Overview](docs/monorepo/overview.md)** — Architecture, applications, tech stack, and Turborepo pipelines
- **[Infrastructure Overview](docs/monorepo/infra/overview.md)** — Azure resources, Terraform environments, naming conventions, and deployment
- **[Environment Configuration](docs/monorepo/infra/configurazione-ambienti.md)** — YAML-based configuration management

### Application-Specific Guides

> 🚧 Coming soon — app-level guides are being written incrementally.

---

## 🏗️ Infrastructure

All infrastructure is managed as code using **Terraform** and deployed on **Microsoft Azure** in the **Italy North** region (`italynorth`).

### Environments

- **`prod`** — Production environment with full application resources
- **`dev`** — Transient development environment (application resources only)
- **`dev-base`** — Permanent development infrastructure (VNet, Key Vault, VPN) — **never destroy**

### Key Features

- **Region**: Italy North (`italynorth`)
- **IaC Tool**: Terraform with PagoPA DX modules
- **Security**: VPN-only access for SMCR portal
- **CI/CD**: GitHub Actions with managed identities
- **State Management**: Azure Blob Storage with Azure AD authentication

For detailed infrastructure documentation, see [docs/monorepo/infra/overview.md](docs/monorepo/infra/overview.md).
For infrastructure workflow and branch strategy rules, see [docs/INFRASTRUCTURE_WORKFLOW.md](docs/INFRASTRUCTURE_WORKFLOW.md). In particular, use `infra/*` branches for infrastructure changes, and run/apply only from the allowed branches (`main` / `infra`) as described in that guide.

---

## 🤝 Contributing

We welcome contributions! Please ensure your code follows the established conventions:

- Use shared ESLint and TypeScript configs from `packages/`
- Follow the naming convention: `sm-{domain}-{type}`
- Write tests for new features
- Update documentation when adding new applications or features

---

## 📄 License

This project is maintained by **PagoPA S.p.A.** for internal use.

---

## 🆘 Support

For questions or issues:

- Check the [documentation](docs/monorepo/)
- Review the [infrastructure guide](docs/monorepo/infra/overview.md)
- Contact the PagoPA Service Management team

---

_Last updated: March 2026_
