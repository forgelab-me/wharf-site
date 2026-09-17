# Users & roles

Admin-only, under **Settings → Users**. Two roles:

| Role | Can do |
|---|---|
| **Admin** | Everything, including managing users, Git connections, registries, authentication settings, and destructive Docker Resources actions — [Browse](/guide/docker-resources#browse-a-volume-admin-only) and deleting images/volumes/networks. |
| **Operator** | Create and deploy stacks, use existing Git connections, restart/stop containers — but can't manage connections/registries/users/auth settings, and doesn't see Browse or any delete action on Images/Volumes/Networks at all. |

::: tip The last admin is protected
Wharf refuses to demote or delete the last remaining admin account outright — a controller with no admin left can never manage anything again.
:::

## Passwords

Creating a user sets a one-time password the admin chooses (at least 8 characters); the new account is forced to change it on first sign-in — shown as a **pending first login** badge next to its name until it does. **Reset password** generates a random one-time password instead and shows it once — it's never retrievable again after that.

An SSO-linked account has no local password and no way to get one — it signs in through the provider only, so there's no **Reset password** action for it at all, either in the UI or the endpoint behind it.

![Users list, showing local vs SSO accounts](/screenshots/users.png)
