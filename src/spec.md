# Specification

## Summary
**Goal:** Complete removal of all password-related code and dead files from the application, ensuring the system uses exclusively Internet Identity Principal-based authentication.

**Planned changes:**
- Remove all password-related types and migration code from backend (OldStaffAccount, OldActor, password fields)
- Delete all frontend password-related files (StaffLoginScreen, ResetAdminPasswordDialog, StaffAuthContext, useStaffAuth, staffSession)
- Clean up imports and references to deleted files across the codebase
- Remove StaffManagementPanel and ensure AdminPrincipalsPanel is the sole admin management interface
- Regenerate frontend bindings and remove temporary type casts
- Add visual note in AdminPrincipalsPanel showing "At least one admin is required" when only one admin remains
- Update project state files to reflect FULLY MIGRATED status

**User-visible outcome:** Admin management interface is streamlined with only the AdminPrincipalsPanel, showing a helpful message when the last admin cannot be removed. The application is fully migrated to Internet Identity authentication with all password-related UI removed.
