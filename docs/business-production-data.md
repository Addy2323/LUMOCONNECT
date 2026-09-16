# Business portal production data

The business portal no longer initializes simulated wallets, payouts, partner directories, deal rooms, subscriptions or security settings. Shared browser financial and inquiry stores are not read. Missing records render an empty state; request failures render an error.

`getAuthenticatedBusiness` requires a database session plus ACTIVE membership in a non-deleted organization. Client user headers are not identity, and missing membership cannot become an OWNER fallback. The portal selects the signed-in user's first active organization, as before; it does not implement an organization switcher.

`GET /api/business/records?kind=…` supports rewards, payments, conversions, team, partners and security. Every business record query is scoped through the authenticated organization; query parameters cannot select a different merchant. The directory shows verified partners connected to that merchant's opportunities, without full phone or email disclosure. Lists are capped at 100 records and are not presented as all-time totals. Payment records show recorded reward status, not a wallet balance or proof of an independently verified bank transfer.

The business profile stores industry, address, email, phone and website on the organization. Only its OWNER/ADMIN can save profile changes. The opportunity wizard starts with blank commercial and contact details and zero numeric inputs; it no longer inserts category sample reward amounts. The landing page no longer fabricates private deal cards or countdowns when the feed is empty.

Previously simulated workflows (business billing, deal rooms, campaign tools, support tickets, scheduled exports, integrations, invitations and local status mutations) do not claim to save, send or settle anything. Unconnected controls show unavailable states. Existing backend payment/reward services and historical records are preserved.

Deploy with all pending Prisma migrations, regenerate the client, rebuild and restart. The `20260916020000_merchant_profile_details` migration adds nullable profile fields without supplying fictional defaults. No production database records were deleted as part of this code cleanup. Browser checks and live database verification remain deployment checks.
