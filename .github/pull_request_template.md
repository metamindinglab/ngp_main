### Summary
- What does this PR change?

### DB Migration Checklist (required)
- [ ] Migration follows Expand–Migrate–Contract (see `templates/sql/expand_migrate_contract_checklist.md`)
- [ ] Backfill strategy is described and tested on staging
- [ ] Destructive changes include a paired `revert_*.sql` (see `templates/sql/revert_migration_template.sql`)
- [ ] Prisma `migrate deploy` dry-run reviewed; risky SQL adjusted
- [ ] Backups/PITR confirmed before deploy

### Rollout
- [ ] No downtime / minimal risk
- [ ] Feature flags or compatibility window accounted for

### Validation
- [ ] Unit/integration tests added/updated
- [ ] Manual verification steps included

### Screenshots/Notes


