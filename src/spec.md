# Specification

## Summary
**Goal:** Add hybrid authentication with admin credentials after Internet Identity login, implement comprehensive search and filtering, add event categories, build notification center, create analytics dashboard, and add CSV/PDF export functionality.

**Planned changes:**
- Implement hybrid authentication: after Internet Identity login, prompt for admin credentials (username: 'rajan', password: 'Admin@123') to grant admin access for creating/managing parties and events
- Add comprehensive search functionality across party names, event names, and event descriptions with real-time filtering
- Implement filtering system for parties and events with date range, party association, and removable filter chips
- Create event categories system (Birthday, Wedding, Corporate, Social, Charity, Other) with category badges and filtering
- Build in-app notification center with notifications for upcoming events (24 hours before), new events, and event updates
- Create analytics dashboard with metrics (total parties/events, events by category, upcoming timeline) displayed using charts and summary cards
- Implement CSV export for party/event data and PDF export for reports with formatted tables and charts
- Fix Party ID generation authorization error by ensuring hybrid authentication properly authorizes admin operations

**User-visible outcome:** Users log in with Internet Identity, then enter admin credentials to access full party/event management. Admins can search and filter parties/events, categorize events, receive in-app notifications, view analytics dashboards with charts, and export data to CSV/PDF formats.
