# Specification

## Summary
**Goal:** Remove authentication requirements from party creation and data import functionality to allow unauthenticated users to manage parties.

**Planned changes:**
- Remove authentication check from PartyFormDialog to allow party creation without login
- Remove authentication check from ExcelPartyImportCard to enable CSV/Excel imports without login
- Remove authentication check from JsonTransferCard import to allow JSON data imports without login

**User-visible outcome:** Users can create parties, import Excel/CSV files, and import JSON data without needing to authenticate or log in.
