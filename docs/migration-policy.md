## Database Migration Policy

This repo follows a safe, forward-only migration strategy with explicit, tested undo scripts for destructive changes.

### Principles
- **Forward fixes > rollbacks**: Prefer corrective migrations over trying to reverse history.
- **Expand–Migrate–Contract**:
  - Expand: Add new columns/indexes/tables (non-breaking). Write to both old and new if needed.
  - Migrate: Backfill data and switch reads to the new shape.
  - Contract: Drop old columns/constraints only after a stabilization window.
- **Reversible destructive changes**: Any drop/rename/destructive op must ship with a `revert_*.sql` script.
- **Deterministic, idempotent SQL**: Use IF EXISTS/IF NOT EXISTS and guard rails where possible.
- **Backups/PITR**: Snapshot or ensure point‑in‑time recovery before risky deploys.

### Workflow (Prisma)
1. Author migrations locally
   - `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql`
   - Hand-edit if needed; keep SQL readable and reversible.
2. Dry-run and review
   - Examine SQL; confirm no unintended drops or locks.
3. Stage first
   - Apply via `npx prisma migrate deploy` on staging with prod-like data.
   - Verify app behavior and performance.
4. Production deploy
   - `npx prisma migrate deploy` (never use dev reset).
   - If a migration fails, fix SQL and: `npx prisma migrate resolve --rolled-back <name>` then redeploy.
5. Rollback strategy
   - Prefer a new corrective migration.
   - If strictly needed, run the paired `revert_*.sql` (see templates below).

### Status & Data Handling
- Store timestamps and immutable IDs; avoid non-deterministic writes.
- When computing statuses from time windows, store only derived values if required for auditing; keep runtime logic computed.

### Required Artifacts for Destructive Migrations
- A revert script in the same PR:
  - Path: `prisma/migrations/<timestamp>_<name>/revert_<name>.sql`
  - Must be tested on staging to restore the prior schema and critical data.
- Update this policy if new patterns arise.

### Templates
- See `templates/sql/revert_migration_template.sql`
- See `templates/sql/expand_migrate_contract_checklist.md`

### Operational Checklists
- Confirm backup/PITR is in place
- Announce expected downtime (if any)
- Monitor after deploy; have a corrective script ready


