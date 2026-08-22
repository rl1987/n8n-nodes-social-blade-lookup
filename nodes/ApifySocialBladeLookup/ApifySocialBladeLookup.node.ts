import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { properties } from './ApifySocialBladeLookup.properties';
import { runActor } from './helpers/executeActor';

export const ACTOR_ID = 'rl1987~social-blade-lookup' as string;

export const PACKAGE_NAME = 'n8n-nodes-social-blade-lookup' as string;
export const CLASS_NAME = 'ApifySocialBladeLookup' as string;
export const ClassNameCamel = CLASS_NAME.charAt(0).toLowerCase() + CLASS_NAME.slice(1);

export const X_PLATFORM_HEADER_ID = 'n8n' as string;
export const X_PLATFORM_APP_HEADER_ID = 'social-blade-lookup-app' as string;

export const DISPLAY_NAME = 'Social Blade Lookup' as string;
export const DESCRIPTION =
	'Look up Social Blade statistics, history and growth for YouTube, TikTok, Instagram and Twitch accounts' as string;

export class ApifySocialBladeLookup implements INodeType {
	description: INodeTypeDescription = {
		displayName: DISPLAY_NAME,
		name: ClassNameCamel,
		icon: 'file:logo.svg',
		group: ['transform'],
		// Mismatched version and defaultVersion as a minor hack to hide "Custom API Call" resource
		version: [1],
		defaultVersion: 1,
		subtitle: 'Look Up Account',
		description: DESCRIPTION,
		defaults: {
			name: DISPLAY_NAME,
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				displayName: 'Apify API key connection',
				name: 'apifyApi',
				required: false,
				displayOptions: {
					show: {
						authentication: ['apifyApi'],
					},
				},
			},
			{
				displayName: 'Apify OAuth2 connection',
				name: 'apifyOAuth2Api',
				required: false,
				displayOptions: {
					show: {
						authentication: ['apifyOAuth2Api'],
					},
				},
			},
		],

		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const data = await runActor.call(this, i);
				for (const item of data) {
					returnData.push({ ...item, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
