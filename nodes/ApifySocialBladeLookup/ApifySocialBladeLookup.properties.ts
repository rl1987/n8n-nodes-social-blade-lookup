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

	const input: Record<string, any> = {
		...defaultInput,
		platform: context.getNodeParameter('platform', itemIndex, 'youtube'),
		queries: toList(queriesRaw),
		resultType: context.getNodeParameter('resultType', itemIndex, 'profile'),
		includeHistory: context.getNodeParameter('includeHistory', itemIndex, true),
		includeGrowth: context.getNodeParameter('includeGrowth', itemIndex, true),
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
		displayName: 'Result Type',
		name: 'resultType',
		type: 'options',
		options: [
			{ name: 'Growth', value: 'growth', description: 'Multi-window growth deltas. Needs a resolved platform ID.' },
			{ name: 'History', value: 'history', description: 'Daily historical data points. Needs a resolved platform ID.' },
			{ name: 'Profile', value: 'profile', description: 'Resolve + fetch profile, history and growth in one call (recommended)' },
			{ name: 'Search', value: 'search', description: 'Matching accounts for a search term' },
			{ name: 'User', value: 'user', description: 'Profile/summary stats only. Needs a resolved platform ID.' },
		],
		default: 'profile',
		description:
			'Profile = resolve + fetch profile+history+growth in one call (recommended). Search = matching accounts for a term. User/history/growth need a resolved platform ID.',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'] } },
	},
	{
		displayName: 'Include History (Profile Mode)',
		name: 'includeHistory',
		type: 'boolean',
		default: true,
		description: 'Whether to include the daily history section when Result Type is Profile',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'], resultType: ['profile'] } },
	},
	{
		displayName: 'Include Growth (Profile Mode)',
		name: 'includeGrowth',
		type: 'boolean',
		default: true,
		description: 'Whether to include the multi-window growth section when Result Type is Profile',
		displayOptions: { show: { resource: ['account'], operation: ['lookup'], resultType: ['profile'] } },
	},
	{
		displayName: 'History Limit (Days)',
		name: 'historyLimit',
		type: 'number',
		default: 30,
		typeOptions: { minValue: 1 },
		description: 'Number of daily data points to fetch for the History and Profile result types',
		displayOptions: {
			show: { resource: ['account'], operation: ['lookup'], resultType: ['profile', 'history'] },
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
		options: [
			{ name: 'Avatar', value: 'avatar' },
			{ name: 'Category', value: 'category' },
			{ name: 'Country', value: 'country' },
			{ name: 'Created At', value: 'createdAt' },
			{ name: 'Display Name', value: 'displayName' },
			{ name: 'Followers', value: 'followers' },
			{ name: 'Growth', value: 'growth' },
			{ name: 'History', value: 'history' },
			{ name: 'Made for Kids', value: 'madeForKids' },
			{ name: 'Platform', value: 'platform' },
			{ name: 'Query', value: 'query' },
			{ name: 'Ranks', value: 'ranks' },
			{ name: 'Result Type', value: 'resultType' },
			{ name: 'SB Grade', value: 'sbGrade' },
			{ name: 'Scraped At', value: 'scrapedAt' },
			{ name: 'Subscribers', value: 'subscribers' },
			{ name: 'Uploads', value: 'uploads' },
			{ name: 'User', value: 'user' },
			{ name: 'Username', value: 'username' },
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
