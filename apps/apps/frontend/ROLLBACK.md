# Rollback Instructions for v1.16.3

## Quick Rollback

If you need to rollback to the previous stable version (v1.16.2):

### Option 1: Using Git Tag (Recommended)

```bash
git checkout frontend-v1.16.2
```

This will restore the exact state of v1.16.2.

### Option 2: Revert Commits

If you're on branch `chore/ui-perf-v1.16.3` and want to revert changes:

```bash
# Revert the styling changes
git revert HEAD~2  # Reverts README changes
git revert HEAD~1  # Reverts index.css changes
git revert HEAD    # Reverts version bump

# Or revert all at once
git revert HEAD~2..HEAD
```

### Option 3: Checkout Specific Files

If you only need to restore specific files:

```bash
git checkout frontend-v1.16.2 -- apps/frontend/src/index.css
git checkout frontend-v1.16.2 -- apps/frontend/package.json
```

## Changed Files in v1.16.3

The following files were modified in this version:

1. **apps/frontend/package.json**
   - Version bumped from `1.16.2` to `1.16.3`

2. **apps/frontend/src/index.css**
   - Complete rewrite with design tokens
   - Removed global scale effects
   - Removed global animations
   - Added prefers-reduced-motion support

3. **apps/frontend/CHANGELOG.md** (new file)
   - Added changelog entry for v1.16.3

4. **apps/frontend/README.md**
   - Added styling and animation guidelines section

## Verification After Rollback

After rolling back, verify:

1. Build succeeds: `npm run build`
2. Visual appearance matches v1.16.2
3. No console errors
4. Buttons and interactions work as before

## Notes

- The tag `frontend-v1.16.2` was created before starting v1.16.3 work
- All changes are backward compatible
- No breaking changes to component APIs
- Visual appearance should remain the same
