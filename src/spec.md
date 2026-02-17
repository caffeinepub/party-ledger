# Specification

## Summary
**Goal:** Speed up Party Ledger startup and login by preventing unnecessary data fetching before full authentication, reducing redundant actor initialization, and avoiding React Query refetch churn during bootstrap.

**Planned changes:**
- Gate all parties/payments-related queries (including due-today alert logic) so they do not run until both Internet Identity and staff authentication are complete.
- Centralize actor creation/initialization so it runs once per Internet Identity session (per principal change) and is shared across hooks/components to avoid repeated initialization sequences.
- Adjust React Query bootstrap behavior to prevent broad invalidation/refetch cascades on actor readiness and ensure startup queries (e.g., profile) do not repeatedly refetch during initial render.

**User-visible outcome:** The app reaches Staff Login (or Dashboard when already staff-authenticated) faster, avoids getting stuck on loading/initializing states, and shows main content and due-today alerts without requiring manual refresh after staff login.
