# GitHub - Azure Federated Identity Setup

Questo modulo Terraform configura l'integrazione tra **GitHub** e **Azure** tramite **Federated Identity Credentials (OIDC)**, creando:

1. **Secrets a livello di repository GitHub**
2. **Ambienti GitHub separati per CI/CD**
3. **Managed Identity in Azure con granularità CI vs CD**

## 🛠️ Cosa viene creato

### 1. **GitHub Repository Secrets**
- `ARM_TENANT_ID`: Tenant ID Azure (condiviso)  
- `ARM_SUBSCRIPTION_ID`: Subscription ID Azure (condiviso)  

### 2. **GitHub Environments**
Vengono creati degli ambienti con variabili/secrets specifici:

| Environment | Purpose                      | Variables                     | Secrets                     |
|-------------|------------------------------|-------------------------------|-----------------------------|
| `infra-dev-ci`    | Infra Continuous Integration (Dev) | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CI Identity) |
| `infra-dev-cd`    | Infra Continuous Delivery (Dev)    | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CD Identity) |
| `infra-prod-ci`   | Infra Continuous Integration (Prod)| `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CI Identity) |
| `infra-prod-cd`   | Infra Continuous Delivery (Prod)   | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CD Identity) |
| `dev-ci`   | Continuous Integration (Dev)   | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CI Identity) |
| `dev-cd`   | Continuous Delivery (Dev)   | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CD Identity) |
| `prod-ci`   | Continuous Integration (Prod)   | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CI Identity) |
| `prod-cd`   | Continuous Delivery (Prod)   | `ARM_SUBSCRIPTION_ID`         | `ARM_CLIENT_ID` (CD Identity) |

### 3. **Azure Identities (in AAD)**
- **Federated Identity per CI**  
  Usata per: `terraform validate`, build, test  
  Scope: Solo lettura su risorse di staging  

- **Federated Identity per CD**  
  Usata per: `terraform apply`, deploy in produzione  
  Scope: Permessi elevati (controllati via RBAC)  

## 🔒 Security Design
- **Separation of Duties**:  
  - La CI **non può** fare deploy  
  - La CD richiede approvazione manuale per `prod` (`protected_branches = true`)  

- **Least Privilege**:  
  - Ogni Identity ha solo i permessi necessari (definiti via Azure RBAC)  

## 🚀 Come usare i secrets in GitHub Actions
Esempio per workflow CI:
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    environment: dev/ci
    steps:
      - uses: azure/login@v1
        with:
          client-id: ${{ secrets.ARM_CLIENT_ID }}
          tenant-id: ${{ secrets.ARM_TENANT_ID }}
          subscription-id: ${{ vars.ARM_SUBSCRIPTION_ID }}