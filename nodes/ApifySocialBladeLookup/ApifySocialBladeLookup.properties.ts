import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

/**
 * Split a newline- or comma-separated string into a trimmed, non-empty list.
 */
function toList(raw: string): string[] {
	return raw
		.split(/\r?\n|,/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

/**
 * Build the Apify Actor input from node parameters.
 * Only the real Actor inputs are sent; Output / Fields shape the returned
 * data and are not part of the Actor input.
 */
export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	const queriesRaw = context.getNodeParameter('queries', itemIndex, '') as string;

	// `mode` names the data layers explicitly, and each layer is charged separately. The
	// node used to send only the Actor's deprecated resultType/includeHistory/includeGrowth
	// inputs, which the Actor honours by BUNDLING all three layers - so every workflow paid
	// for history and growth even when it only wanted a profile snapshot, and the cheap
	// single-layer modes were unreachable from n8n.
	const input: Record<string, any> = {
		...defaultInput,
		platform: context.getNodeParameter('platform', itemIndex, 'youtube'),
		queries: toList(queriesRaw),
		mode: context.getNodeParameter('mode', itemIndex, 'profile'),
		historyLimit: context.getNodeParameter('historyLimit', itemIndex, 30),
	};

	return input;
}

const resourceProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Account',
				value: 'account',
			},
		],
		default: 'account',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Lookup',
				value: 'lookup',
				action: 'Look up account',
				description: 'Look up Social Blade statistics for one or more accounts',
			},
		],
		default: 'lookup',
	},
];

const actorProperties: INodeProperties[] = [
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		required: true,
		options: [
			{ name: 'Instagram', value: 'instagram' },
			{ name: 'TikTok', value: 'tiktok' },
			{ name: 'Twitch', value: 'twitch' },
			{ name: 'YouTube', value: 'youtube' },
		],
		default: 'youtube',
		description:
			'The social platform to look up. A query URL that identifies its own platform overrides this field.',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'] } },
	},
	{
		displayName: 'Handles / IDs / Profile URLs',
		name: 'queries',
		type: 'string',
		required: true,
		typeOptions: { rows: 4 },
		default: 'https://www.youtube.com/@mrbeast',
		placeholder: 'https://www.youtube.com/@mrbeast',
		description:
			'One entry per line (or comma-separated): a handle, a platform ID, a profile URL, or a Social Blade URL. A URL that identifies the platform overrides the Platform field.',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'] } },
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		options: [
			{ name: 'Everything (Profile + History + Growth)', value: 'all', description: 'All three layers. Charges three events per account.' },
			{ name: 'Growth Only', value: 'growth', description: 'Multi-window growth deltas. Accepts a handle, ID or URL. One event.' },
			{ name: 'History Only', value: 'history', description: 'Daily history rows (about 31 days). Accepts a handle, ID or URL. One event.' },
			{ name: 'Profile + Growth', value: 'profile-growth', description: 'Snapshot plus growth windows. Two events.' },
			{ name: 'Profile + History', value: 'profile-history', description: 'Snapshot plus the daily series. Two events.' },
			{ name: 'Profile Only', value: 'profile', description: 'Stats snapshot only — the cheapest single-account lookup. One event.' },
			{ name: 'Search', value: 'search', description: 'Matching accounts for a search term. One event.' },
			{ name: 'User Record', value: 'user', description: 'Profile summary by platform ID. One event.' },
		],
		default: 'profile',
		description:
			'Which data layers to fetch. Each layer is charged separately, so pick only what you need — "Everything" charges three events per account where "Profile Only" charges one.',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'] } },
	},
	{
		displayName: 'History Limit (Days)',
		name: 'historyLimit',
		type: 'number',
		default: 30,
		typeOptions: { minValue: 1 },
		description:
			'How many daily data points to fetch. Social Blade serves about 31 days to anonymous callers, so larger values return about 31 rows.',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['lookup'],
				mode: ['profile-history', 'all', 'history'],
			},
		},
	},
];

const outputProperties: INodeProperties[] = [
	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'], operation: ['lookup'] } },
		options: [
			{
				name: 'Raw',
				value: 'raw',
				description: 'Return every field the API produces for each account',
			},
			{
				name: 'Selected Fields',
				value: 'selected',
				description: 'Choose exactly which fields to return',
			},
			{
				name: 'Simplified',
				value: 'simplified',
				description: 'Return a compact set of the most useful account fields',
			},
		],
		default: 'simplified',
		description: 'How much data to return for each account',
	},
	{
		displayName: 'Fields to Include',
		name: 'fields',
		type: 'multiOptions',
		displayOptions: {
			show: { resource: ['account'], operation: ['lookup'], output: ['selected'] },
		},
		// Mirrors the Actor's dataset schema as of 2026-10-21. `user` and `ranks` are gone:
		// the upstream profile blob is no longer emitted and the ranks are flat columns.
		options: [
			{ name: 'Account ID', value: 'id' },
			{ name: 'Average Comments', value: 'averageComments' },
			{ name: 'Average Likes', value: 'averageLikes' },
			{ name: 'Avatar', value: 'avatar' },
			{ name: 'Category', value: 'category' },
			{ name: 'Country', value: 'country' },
			{ name: 'Created At', value: 'createdAt' },
			{ name: 'Display Name', value: 'displayName' },
			{ name: 'Engagement Rate', value: 'engagementRate' },
			{ name: 'Error', value: 'error' },
			{ name: 'Followers', value: 'followers' },
			{ name: 'Following', value: 'following' },
			{ name: 'Growth', value: 'growth' },
			{ name: 'History', value: 'history' },
			{ name: 'Likes', value: 'likes' },
			{ name: 'Linked Socials', value: 'socials' },
			{ name: 'Made for Kids', value: 'madeForKids' },
			{ name: 'Platform', value: 'platform' },
			{ name: 'Query', value: 'query' },
			{ name: 'Rank by Category', value: 'rankCategory' },
			{ name: 'Rank by Country', value: 'rankCountry' },
			{ name: 'Rank by Engagement Rate', value: 'rankEngagementRate' },
			{ name: 'Rank by Followers', value: 'rankFollowers' },
			{ name: 'Rank by Likes', value: 'rankLikes' },
			{ name: 'Rank by Subscribers', value: 'rankSubscribers' },
			{ name: 'Rank by Video Count', value: 'rankVideos' },
			{ name: 'Rank by Views', value: 'rankViews' },
			{ name: 'Rank Overall (SB)', value: 'rankSb' },
			{ name: 'Result Type', value: 'resultType' },
			{ name: 'SB Grade', value: 'sbGrade' },
			{ name: 'Scraped At', value: 'scrapedAt' },
			{ name: 'Search Results', value: 'results' },
			{ name: 'Stats Hidden', value: 'statsHidden' },
			{ name: 'Subscribers', value: 'subscribers' },
			{ name: 'Uploads', value: 'uploads' },
			{ name: 'Username', value: 'username' },
			{ name: 'Verified', value: 'verified' },
			{ name: 'Views', value: 'views' },
		],
		default: ['platform', 'query', 'username', 'displayName', 'followers', 'subscribers', 'sbGrade'],
		description: 'Which fields to return when Output is set to Selected Fields',
	},
];

const authenticationProperties: INodeProperties[] = [
	{
		displayName: 'Authentication',
		name: 'authentication',
		type: 'options',
		options: [
			{
				name: 'API Key',
				value: 'apifyApi',
			},
			{
				name: 'OAuth2',
				value: 'apifyOAuth2Api',
			},
		],
		default: 'apifyApi',
		description: 'Choose which authentication method to use',
	},
];

export const properties: INodeProperties[] = [
	...resourceProperties,
	...actorProperties,
	...outputProperties,
	...authenticationProperties,
];
