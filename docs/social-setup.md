# Social feed setup (Instagram + Facebook)

The site never loads Meta scripts. A server job copies recent posts (and their images) into
the CMS; visitors only ever see our own copy. Meta's dashboards change often, so treat the
click paths below as a guide and follow Meta's current docs where they differ.

## 1. Meta app (once)

1. Sign in at <https://developers.facebook.com> and create an app (type **Business**).
2. Add the **Instagram** product, choosing **API setup with Instagram login**.
   The old Basic Display API is shut down; do not use it.
3. The Instagram account must be a **Professional** (Business or Creator) account.
4. Add the account under the app's Instagram roles (tester) while the app is in development mode.
   Posts from your *own* account can be read in development mode without app review.

## 2. Instagram token

1. In the app dashboard, Instagram → API setup → **Generate token** for your account
   (permission `instagram_business_basic`). This is a long-lived token (about 60 days).
2. Paste it into **Admin → Social Feed → Connections → Instagram token**, tick **Instagram enabled**
   on the Display tab, and click **Sync now** on the Sync status tab.
3. The `token-refresh` cron job extends the token every 14 days. If the token ever lapses,
   generate a new one and paste it again. The admin is emailed when a refresh fails.

## 3. Facebook Page token

1. Add the **Facebook Login for Business** / Graph API access to the same app.
2. Using the Graph API Explorer, get a **Page access token** for your Page with the
   `pages_read_engagement` permission. Exchange a long-lived user token for the Page token
   so it does not expire.
3. Paste the **Page ID** and **Page token** into Admin → Social Feed → Connections and tick
   **Facebook enabled**.

## 4. Environment variables

```
META_GRAPH_VERSION=v21.0     # Graph API version used for Facebook calls
CRON_SECRET=<openssl rand -hex 32>
```

(Never set `INSTAGRAM_GRAPH_BASE`, `FACEBOOK_GRAPH_BASE` or `TURNSTILE_VERIFY_URL` in production;
they exist only so tests can point at a stub.)

## 5. Cron (on the server, see CLAUDE.md §9)

```
0 * * * *     curl -fsS -H "x-cron-secret: $CRON_SECRET" https://DOMAIN/internal/cron/social-sync
0 3 */14 * *  curl -fsS -H "x-cron-secret: $CRON_SECRET" https://DOMAIN/internal/cron/token-refresh
```

## How it behaves

- New posts are fetched, their image is downloaded into Media (R2), and the post is saved.
  Meta image URLs are signed and expire, so they are never stored or shown.
- Existing posts only get their caption and link refreshed; **hidden** and **pinned** are never touched.
- Posts gone from Instagram/Facebook are removed once they fall outside the newest 50 for that platform.
- If a platform fails, the other still syncs, existing posts stay, the status turns to *Failed*
  and the admin gets an email.
- The Social section and its nav link appear only when at least one enabled platform has posts.
