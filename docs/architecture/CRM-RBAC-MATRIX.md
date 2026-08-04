# Admin CRM — RBAC & Administrative Security Matrix

Status: Approved planning baseline  
Branch: `architecture/admin-crm-integration`

## Principle

Least privilege. Every administrative action must be authorized on the server and sensitive actions must be audited.

## Official roles

- `SUPER_ADMIN`: exceptional global access; MFA mandatory.
- `EXECUTIVE`: read-only executive indicators.
- `COMMERCIAL_MANAGER`: full commercial workflow.
- `COMMERCIAL_AGENT`: assigned leads and activities only.
- `FINANCE_MANAGER`: financial operations and approvals; MFA mandatory.
- `FINANCE_ANALYST`: financial preparation and reconciliation without final approval.
- `CONTENT_MANAGER`: content approval and publication.
- `CONTENT_EDITOR`: content creation and editing.
- `OPERATIONS_MANAGER`: onboarding, bookings, tickets and incidents.
- `SUPPORT_AGENT`: limited customer and order support access.
- `AFFILIATE_MANAGER`: Morro Digital affiliate network administration.
- `AUDITOR`: audit-only read access.
- `READ_ONLY`: explicit scoped read access.

## Permission convention

```text
domain.resource.action
```

Examples:

```text
identity.users.read
businesses.approve
subscriptions.cancel
payments.refund.approve
affiliates.attributions.review
finance.payouts.approve
content.publish
audit.export
```

## Segregation of duties

- A payout preparer cannot approve the same payout.
- A ledger adjustment requester cannot approve it.
- High-value refunds require a second approver.
- Content editors cannot approve their own content where dual approval is enabled.
- Affiliate managers cannot alter settled financial values.
- Support agents never access full secrets, tokens, card data or unmasked documents.
- Auditors cannot execute mutations.

## Authentication requirements

- HttpOnly, Secure cookies.
- No auth token in localStorage.
- MFA for critical roles and critical actions.
- Idle timeout and maximum session lifetime.
- Session revocation after credential change or security incident.
- Progressive lockout and suspicious-login alerts.
- Documented key and secret rotation.

## Authorization requirements

- Every tRPC procedure must be protected server-side.
- Hidden navigation is not authorization.
- Permission checks include user, role and future tenant scope.
- Sensitive resources validate ownership, tenant and operational context.

## Mandatory audit fields

- actor user and role
- action and resource
- minimal before/after state
- reason
- request ID
- IP and user-agent
- timestamp
- result
- related approval

Never log passwords, full tokens, secrets, card data or unnecessary full documents.

## Implementation order

1. Create a typed permission catalog.
2. Create role and user-role persistence.
3. Implement `protectedProcedure` and `requirePermission`.
4. Map every current route to permissions.
5. Refactor sidebar and route guards.
6. Add centralized audit logging.
7. Add MFA to critical roles.
8. Add authorization and segregation-of-duty tests.

## Acceptance criteria

- Every current route has an explicit permission.
- No mutation succeeds without server authorization.
- Tests cover allow and deny scenarios.
- Navigation reflects permissions but does not replace backend checks.
- Critical actions require MFA or reinforced confirmation.
- Role changes, payouts, refunds, suspensions and publications are audited.
