## Expand–Migrate–Contract Checklist

### Expand (non-breaking)
- [ ] Add new columns/tables/indexes (IF NOT EXISTS)
- [ ] Write to both old and new columns (app code)
- [ ] Default values and nullability confirmed

### Migrate (data move + flip reads)
- [ ] Backfill new columns from old
- [ ] Read path switched to new columns
- [ ] Metrics/monitoring verified

### Contract (cleanup)
- [ ] Remove old columns/indexes after stabilization
- [ ] Paired revert_*.sql included in the PR
- [ ] Verified on staging; backup ready


