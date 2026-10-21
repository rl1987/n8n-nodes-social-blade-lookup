# n8n-nodes-social-blade-lookup

An [n8n](https://n8n.io/) community node that looks up Social Blade statistics, history and growth for YouTube, TikTok, Instagram and Twitch accounts. It is backed by the [Social Blade Lookup](https://apify.com/rl1987/social-blade-lookup) Actor on [Apify](https://apify.com) and bills per event, so there are no subscriptions and no minimums.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Output](#output) · [Example workflows](#example-workflows) · [Pricing](#pricing) · [Resources](#resources)

## What it does

Give the node a handle, platform ID, profile URL, or Social Blade URL for one or more accounts, and it returns Social Blade's headline metrics, daily history, and multi-window growth deltas for each one. It resolves handles/URLs automatically, mixes platforms in a single run when the query URL identifies its own platform, and works as an **AI Agent tool**, so an agent can answer questions like "how many subscribers does this channel have?" on demand. Good for **creator research**, **competitor benchmarking**, and **growth tracking** across YouTube, TikTok, Instagram, and Twitch.

- Look up by handle, platform ID, profile URL, or Social Blade URL
- Profile mode resolves the account and returns profile, history, and growth in one call
- Search mode finds matching accounts for a term
- Choose how much data to return per result: Simplified, Raw, or Selected Fields

## Installation

Follow the n8n [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/):

1. In n8n, open **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-social-blade-lookup` as the npm package name.
4. Agree to the risks of using community nodes, then select **Install**.

After it installs, the **Social Blade Lookup** node appears in the nodes panel.

> n8n Cloud only allows verified community nodes. Until this node is verified, install it on a self-hosted n8n instance.

## Credentials

You need a free [Apify account](https://apify.com) and an API token.

1. Sign in to the [Apify Console](https://console.apify.com).
2. Open **Settings > Integrations** and copy your **Personal API token**.
3. In n8n, create a new **Apify API** credential and paste the token.
4. Use the credential's **Test** button to confirm it works.

The node also supports **Apify OAuth2** if you prefer to connect that way.

## Operations

**Account > Lookup** returns Social Blade data for one or more accounts.

| Parameter | Description |
| --- | --- |
| Platform | The social platform to look up: YouTube, TikTok, Instagram, or Twitch. A query URL that identifies its own platform overrides this field. |
| Handles / IDs / Profile URLs | One entry per account: a handle, a platform ID, a profile URL or a Social Blade URL, one per line (or comma-separated). Subdomains such as `m.youtube.com` work, and the account is read from the start of the path so a `/video/` or `/clips/` link still resolves. Share links (`youtu.be`, `vm.tiktok.com`), video/post pages and unknown hosts come back as an explanatory row at no charge. |
| Mode | Which data layers to fetch. Each layer is charged separately, so pick only what you need: **Profile Only** (one event) is the cheapest single-account lookup, **Everything** charges three. `History Only` and `Growth Only` accept a handle, ID or URL and resolve it for you at no extra charge. |
| History Limit (Days) | How many daily data points to fetch. Social Blade serves about **31 days** to anonymous callers, so larger values return about 31 rows. |
| Output | How much data to return: Simplified, Raw, or Selected Fields. |

## Output

Each account is returned as its own n8n item. The **Output** parameter lets you choose how much to return:

- **Simplified** (default): the identity columns (`platform`, `resultType`, `query`, `id`, `scrapedAt`) plus whichever headline figures the chosen mode actually returns, and a count for each section it carries (`historyDays`, `growthMetrics`, `resultCount`) rather than the series itself. This mode is also used automatically when the node runs as an AI Agent tool, to keep responses small.
- **Raw**: every field the API returns for each account, using the original field names below.
- **Selected Fields**: pick exactly which fields to include.

### Fields (Raw and Selected Fields)

| Field | Type | Description |
| --- | --- | --- |
| `platform` | string | The resolved platform: `youtube`, `tiktok`, `instagram`, or `twitch` |
| `query` | string | The original query you supplied |
| `resultType` | string | The result type that was fetched |
| `username` | string | Account username/handle |
| `displayName` | string | Account display name |
| `avatar` | string | Avatar image URL |
| `sbGrade` | string | Social Blade grade, for example `A+` |
| `followers` | number | Follower count (TikTok/Instagram/Twitch) |
| `subscribers` | number | Subscriber count (YouTube) |
| `views` | number | Total view count (YouTube) |
| `likes` | number | Total likes (TikTok) |
| `uploads` | number | Published items — videos on YouTube/TikTok, posts on Instagram |
| `following` | number | Accounts this one follows (TikTok/Instagram/Twitch) |
| `verified` | boolean | Verification badge (TikTok/Twitch) |
| `engagementRate`, `averageLikes`, `averageComments` | number | Engagement figures (Instagram) |
| `country` | string | Account's country (YouTube) |
| `category` | string | Social Blade category (YouTube) |
| `createdAt` | string | Account creation date. Null on TikTok, where Social Blade returns an epoch artifact rather than a date |
| `madeForKids` | boolean | Whether the account is flagged as made for kids |
| `statsHidden` | boolean | Whether Social Blade is withholding this account's counts |
| `socials` | array | URLs the creator links from their profile (plain strings) |
| `rankSb`, `rankSubscribers`, `rankFollowers`, `rankViews`, `rankVideos`, `rankLikes`, `rankEngagementRate`, `rankCountry`, `rankCategory` | number | Social Blade league-table positions, one column each. Rank 1 is the top |
| `id` | string | The platform's canonical account ID |
| `error` | string | Why a query produced no data; null on successful rows |
| `history` | array | Daily historical data points (profile/history modes) |
| `growth` | object | Multi-window growth deltas (profile/growth modes) |
| `results` | array | Matching accounts (search mode) |
| `scrapedAt` | string | Timestamp when the data was scraped |

Each mode returns only the fields it can fill, with an explicit `null` where Social Blade
publishes nothing — so the item shape is stable across accounts within a run.

> **Changed in 0.2.0.** The **Result Type** parameter and the two *Include…* toggles are
> replaced by a single **Mode**, because the Actor's deprecated inputs bundle all three data
> layers and charge for all three: a workflow that only wanted a profile snapshot was paying
> three times over. Re-pick your mode after upgrading. The `user` object and the `ranks` object
> are no longer returned — every scalar worth having is now its own column (see `rank…`,
> `likes`, `verified`, `engagementRate`), and `socials` is a list of URL strings.

## Example workflows

### 1. Track a creator's follower growth weekly

1. **Schedule Trigger** (weekly).
2. **Social Blade Lookup**: Platform `YouTube`, Handles `https://www.youtube.com/@mrbeast`.
3. **Google Sheets**: append `followers`, `subscribers`, and `scrapedAt` to a tracking sheet.

### 2. Compare Social Blade grades across competitors

1. **Social Blade Lookup**: Handles listing several competitor channel URLs, one per line.
2. **Sort**: order results by `sbGrade` or `followers`.
3. **Slack**: post a leaderboard summary.

### 3. Let an AI Agent check a channel's stats

1. **AI Agent** node.
2. Attach **Social Blade Lookup** as a tool.
3. Ask "How many subscribers does this YouTube channel have?" The agent calls the node (in Simplified mode) and returns the account's stats.

## Pricing

This node calls the [Social Blade Lookup](https://apify.com/rl1987/social-blade-lookup) Actor on Apify, which is billed **pay-per-event**: $0.01 per profile/search lookup, $0.01 for history data, and $0.01 for growth data (charged independently per query, when returned). No subscription. Apify also includes a free monthly usage tier that covers typical volumes. See the [Actor page](https://apify.com/rl1987/social-blade-lookup) for current rates.

## Resources

- [Social Blade Lookup on Apify](https://apify.com/rl1987/social-blade-lookup)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Apify n8n integration guide](https://docs.apify.com/platform/integrations/n8n)

## License

[MIT](LICENSE.md)
