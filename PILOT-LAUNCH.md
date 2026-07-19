# VI Guide paid pilot launch

## Launch scope

Start with scheduled St. Thomas transfers for one association and a small group of hotel, villa, or property partners. Do not activate an island until it has one reviewed active tariff and enough credentialed operators.

## Non-negotiable launch gates

1. Written regulatory and legal review of the tariff, booking flow, cancellation policy, payment handling, and any separately charged service fee.
2. Signed association/operator agreement and property-partner agreement.
3. One active official tariff document for every enabled island and route.
4. At least three credentialed drivers with linked inspected and insured fleet vehicles; target 10 before a public campaign.
5. Live Stripe account, signed webhook, refund process, reconciliation owner, and successful end-to-end payment test.
6. Production Firebase project, deployed rules and indexes, backup/export policy, audit access, and separate staging project.
7. HTTPS custom domain, monitored support email and phone, terms, privacy notice, cancellation policy, and incident contact.
8. Tested ride request, payment, assignment, reassignment, cancellation, completion, settlement review, and support recovery.

Use `/admin/readiness` to verify the machine-checkable gates.

## Pilot offer

- Association dispatch and compliance workspace: test $499/month.
- Property concierge and scheduled-transfer link: test $149/property/month.
- Do not deduct a percentage of the regulated fare until a reviewed written fee agreement is configured.

## First 30 days

- Week 1: tariff approval, production configuration, association agreement, first three operators.
- Week 2: internal rides and failure recovery; onboard property staff.
- Week 3: invite-only guest bookings with daily reconciliation.
- Week 4: review acceptance time, completion rate, refunds, support load, and renewal intent.

## Pilot success metrics

- 100 completed paid rides.
- 90% or better dispatch acceptance.
- Median assignment confirmation under five minutes.
- 95% or better completion without manual recovery.
- Fewer than 3% refunds or disputes.
- At least three paying property renewals.

## Deployment sequence

```bash
npm ci
npm run build
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Deploy the Next.js application to the selected production host only after the build passes with production environment variables. Register the production Stripe webhook URL, run a live low-value test booking, verify the event audit trail, then enable the first partner booking link.
