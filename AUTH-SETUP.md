# VI Guide authentication setup

1. In Firebase Console → Authentication → Sign-in method, enable **Email/Password** and **Google**.
2. Copy `.env.example` to `.env.local` and enter the Firebase web-app values plus Firebase Admin credentials.
3. Add your CodeSandbox/deployment hostname under Authentication → Settings → Authorized domains.
4. Deploy `firestore.rules` with your Firebase project tooling before enabling production traffic.
5. Create your account at `/login`, then assign staff roles from a trusted terminal:

```bash
npm run auth:set-role -- owner@example.com admin
npm run auth:set-role -- dispatch@example.com dispatcher
npm run auth:set-role -- driver@example.com driver FIRESTORE_DRIVER_ID
```

Users must sign out and sign back in after a role change so Firebase refreshes their claims. New accounts default to the `rider` role.

Never expose Firebase Admin credentials or Stripe secret keys through `NEXT_PUBLIC_` variables or commit `.env.local`.
