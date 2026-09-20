# Notifications

Admin-only, under **Settings → Notifications**. One webhook, fired on the handful of events worth knowing about without staring at the UI.

| Event | When it fires |
|---|---|
| Deployment failed | Immediately |
| An enrolled agent goes dark | Checked every few minutes |
| An agent falls behind on updates | Checked every few minutes |
| The controller itself falls behind | Checked every few minutes |

The three periodic checks are debounced: each notifies once when the condition starts, and resets once it clears, rather than repeating on every check for as long as it stays true. A routine controller restart — which briefly disconnects every agent while they reconnect — doesn't fire a false "agent disconnected" wave, since the check only runs a few minutes apart, not the instant the tunnel drops.

## Setting it up

Pick a **Kind** and paste a **Webhook URL**:

| Kind | Where the URL comes from |
|---|---|
| Slack | An [incoming webhook](https://api.slack.com/messaging/webhooks) for the channel you want |
| Discord | A channel's webhook URL, from that channel's settings |
| ntfy | A topic URL, e.g. `https://ntfy.sh/your-topic-name` |
| Generic | Any endpoint that accepts a POST with `{"text": "..."}` as JSON |

**Send test** fires a real notification through the exact same code path a real event would, so a successful test means it'll actually work when something happens. Replacing a target only needs a new URL if you're changing it — leaving the URL field blank keeps the one already stored, same as a registry credential's password field.

The URL itself is treated as a credential: stored in the same isolated store as every stack's secrets, never shown again once saved, and never written to the [audit log](/guide/audit-log) — only the kind is.
