# Specification

## Summary
**Goal:** Remove all authentication guards from party ID generation and party creation to allow unauthenticated users to create parties.

**Planned changes:**
- Remove authentication checks from the validateAndGeneratePartyId function in backend/main.mo
- Remove or modify staff authentication requirement from the addParty function in backend/main.mo
- Remove caller identity checks and authentication guards from all public query and update methods used for party management
- Verify that PartyFormDialog component can generate party IDs and create parties without authorization errors

**User-visible outcome:** Users can create parties immediately after opening the app without logging in or encountering "Unauthorized" errors.
