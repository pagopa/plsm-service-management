## 🏗️ Infrastructure Change

### Description

<!-- Describe what infrastructure resources are being added/modified/removed -->

### Related Feature/Issue

<!-- Link to the feature branch or issue that requires this infrastructure change -->

- Related to: #issue_number or `feature/branch-name`

### Resources Changed

<!-- List the main resources being modified -->

- [ ] Key Vault secrets/keys
- [ ] App Service environment variables
- [ ] Network resources (VNet, Subnet, NSG)
- [ ] Storage accounts
- [ ] Azure Functions
- [ ] API Management
- [ ] Other: ******\_******

### Environment

- [ ] DEV
- [ ] PROD
- [ ] Both

### Terraform Plan Summary

<!--
The terraform plan output will be automatically posted by the CI/CD pipeline.
Review it carefully before merging.
-->

### Pre-Merge Checklist

- [ ] Terraform plan reviewed and approved
- [ ] No unexpected resource deletions
- [ ] Naming conventions followed (PagoPA standards)
- [ ] Secrets/sensitive data NOT committed
- [ ] Documentation updated (if needed)
- [ ] Related feature branch exists and will be synced after merge

### Post-Merge Actions

- [ ] Monitor terraform apply completion
- [ ] Verify resources created correctly in Azure Portal
- [ ] Sync related feature branches with `main`:
  ```bash
  git checkout feature/your-branch
  git merge main
  ```
- [ ] Delete this `infra/*` branch after successful apply

### Rollback Plan

<!-- How to revert this change if something goes wrong? -->

---

**⚠️ Remember:** This PR will trigger an automatic `terraform apply` when merged to `main`.
