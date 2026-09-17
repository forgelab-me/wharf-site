# Authentication (SSO)

Admin-only, under **Settings → Authentication**. Configure any standard OIDC provider — Authelia, Keycloak, Authentik, Okta, and so on.

## Setting it up

1. Register Wharf as a client on the provider, using the redirect URI shown on the page.
2. Paste the issuer URL, client ID, and client secret back into Wharf. **Button label** is optional and cosmetic only — `/login`'s SSO button always reads "Continue with `<label>`" (defaults to "Continue with SSO"); set it to your provider's name if you'd rather it read "Continue with Authelia" or similar.

Editing an existing configuration doesn't require re-entering the client secret — leave it blank to keep what's already stored.

![Authentication settings page](/screenshots/authentication.png)

## Local sign-in is throttled

A handful of failed local sign-ins for the same username never trigger anything — a typo shouldn't cost you time. Past that, each further failure locks that username out for a delay that doubles every time (capped at a few minutes), independent of any other account. Getting the password right immediately clears it. There's nothing to configure; it's always on.

## Mapping AD/LDAP groups to roles

**Admin group** / **Operator group** (both optional) are matched against the provider's `groups` claim on *every* sign-in, not just the first: a member of the admin group becomes/stays admin, a member of the operator group becomes/stays operator, checked fresh each time — losing group membership demotes on the next login.

::: warning Setting either group turns sign-in into an allowlist
Once one of these is configured, **only** members of those groups can sign in at all — everyone else is refused, not silently given an operator seat. Leave both blank and anyone who can authenticate against the provider gets an account automatically, as operator.
:::

Your provider needs to actually send a `groups` claim, and its client registration needs to permit the `groups` scope — for Authelia specifically, that means adding `groups` to the client's `scopes` list, backed by an LDAP/AD group lookup.

## Disabling local sign-in

Once SSO is working end to end, **Disable local username/password sign-in** forces every sign-in through the provider.

::: danger Real lockout risk
There's no built-in way back in if the provider becomes unreachable or misconfigured after this is turned on — recovering requires direct access to the controller's database. Confirm you can actually sign in via SSO, with an account you can get into, before turning this on.
:::
