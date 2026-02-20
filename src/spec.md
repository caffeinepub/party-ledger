# Specification

## Summary
**Goal:** Fix the admin authorization system to allow the first authenticated user to become admin and properly validate admin permissions for shop branding operations.

**Planned changes:**
- Automatically register the first authenticated user as admin when no admins exist in the system
- Ensure the isAdmin check properly validates caller Principal against adminPrincipals before allowing shop branding operations
- Add debug logging to trace Principal authentication and admin authorization checks

**User-visible outcome:** The first user to authenticate will automatically become an admin and can successfully update shop branding (name and logo) without receiving "Unauthorized" errors.
