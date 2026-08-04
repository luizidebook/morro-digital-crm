# Admin CRM — Module & Dependency Matrix

Status: Approved planning baseline  
Branch: `architecture/admin-crm-integration`

## Core rules

- Admin CRM is the global administrative control center.
- Business Portal remains a separate application for each company.
- CRM consumes Morro Digital Core through authenticated Admin APIs.
- CRM must not access the Core PostgreSQL database directly.
- The affiliate network belongs exclusively to Morro Digital; sellers do not manage affiliates.
- Business rules must not remain embedded in monolithic routers or UI components.

## Existing modules

| Module | Decision | Target domain | Main action |
|---|---|---|---|
| Dashboard | Reuse + refactor | Executive Analytics | Replace mock metrics with Admin API data |
| Leads | Reuse | Commercial | Split router/service/repository and add ownership/SLA |
| Lead Detail | Reuse + modularize | Commercial | Build 360-degree relationship view |
| Meetings | Reuse | Commercial | Add assignees, reminders and calendar integration |
| Proposals | Reuse + integrate | Commercial | Use versioned plan catalog and immutable snapshots |
| Contracts | Partial reuse | Contract Administration | Core remains source of truth for official contracts |
| Follow-ups | Reuse | Commercial | Add priority, SLA, recurrence and templates |
| Trials | Re-evaluate | Commercial | Formalize meaning before expanding |
| Referrals | Rename/remove | B2B referrals only | Must not represent platform affiliates |
| Settings | Reuse + split | Platform Administration | Separate users, roles, security, integrations and flags |
| AI Chat | Isolate | Admin Assistant | Permission-aware queries and full audit |
| Map | Future reuse | Operations | Consume geospatial Admin APIs |

## Required new modules

1. Identity & Access
2. Businesses
3. Subscriptions & Billing
4. Payments
5. Barter
6. Marketplace Administration
7. Bookings
8. Tickets
9. Affiliate Network
10. Finance
11. Content & Moderation
12. Support & Incidents
13. Audit & Compliance
14. Integrations

## Allowed dependency direction

```text
UI -> Application -> Domain Contracts -> API Clients / Repositories
```

## Forbidden dependencies

- UI -> database
- Domain module -> React component
- CRM -> Core PostgreSQL directly
- Seller/Business -> Affiliate management
- Monolithic router -> embedded business policy

## Priority

### P0
Identity & Access, RBAC, Admin API Client, Businesses, Subscriptions, Payments, Audit.

### P1
Commercial refactor, Contracts integration, Barter, Content moderation, Notifications.

### P2
Marketplace, Bookings, Tickets, Affiliate Network, advanced Finance.

### P3
Advanced analytics, AI administration, full multi-tenancy and broad automations.

## Target repository structure

```text
client/src/
  app/
  modules/
    dashboard/
    commercial/
    businesses/
    subscriptions/
    payments/
    affiliates/
    marketplace/
    operations/
    settings/
  shared/
    api/
    auth/
    components/
    design-system/
    hooks/
    utils/

server/
  modules/
    identity/
    commercial/
    audit/
    integrations/
  shared/
    auth/
    config/
    errors/
    observability/
  app-router.ts
```

## Acceptance criteria

- Every module has an owner, permission set and API contract.
- Every sensitive administrative action creates an audit event.
- Core data is accessed only through the Admin API Client.
- Modules are independently testable.
- Navigation is permission-aware.
- Affiliate management exists only at platform level.
