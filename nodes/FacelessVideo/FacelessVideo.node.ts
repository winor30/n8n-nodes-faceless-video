import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import {
  NodeApiError,
  NodeConnectionTypes,
  NodeOperationError,
  sleep,
} from 'n8n-workflow';

const POLL_DELAY_MS = 3000;
const POLL_MAX_ATTEMPTS = 100;

export class FacelessVideo implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Faceless Video',
    name: 'facelessVideo',
    icon: {
      light: 'file:facelessVideo.svg',
      dark: 'file:facelessVideo.dark.svg',
    },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description:
      'Generate captioned, voiced 9:16 videos via the Faceless Video API',
    defaults: {
      name: 'Faceless Video',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'facelessVideoApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Generate',
            value: 'generate',
            action: 'Generate a video',
            description: 'Enqueue a render from a list of segments',
          },
          {
            name: 'Get Result',
            value: 'getResult',
            action: 'Get a video result',
            description: 'Fetch the status and URL of a render job',
          },
        ],
        default: 'generate',
      },
      {
        displayName: 'Segments',
        name: 'segments',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        placeholder: 'Add Segment',
        default: {},
        required: true,
        displayOptions: {
          show: {
            operation: ['generate'],
          },
        },
        description: 'Each segment becomes one voiced, captioned scene',
        options: [
          {
            name: 'segment',
            displayName: 'Segment',
            values: [
              {
                displayName: 'Text',
                name: 'text',
                type: 'string',
                default: '',
                required: true,
                description: 'Narration and on-screen caption for this segment',
              },
              {
                displayName: 'Image URL',
                name: 'imageUrl',
                type: 'string',
                default: '',
                placeholder: 'https://example.com/image.jpg',
                description:
                  'Optional background image; a solid background is used when empty',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Voice',
        name: 'voice',
        type: 'options',
        default: 'alloy',
        displayOptions: {
          show: {
            operation: ['generate'],
          },
        },
        options: [
          { name: 'Alloy', value: 'alloy' },
          { name: 'Echo', value: 'echo' },
          { name: 'Fable', value: 'fable' },
          { name: 'Nova', value: 'nova' },
          { name: 'Onyx', value: 'onyx' },
          { name: 'Shimmer', value: 'shimmer' },
        ],
        description: 'The OpenAI TTS voice used to narrate the video',
      },
      {
        displayName: 'Aspect Ratio',
        name: 'aspect',
        type: 'options',
        default: '9:16',
        displayOptions: {
          show: {
            operation: ['generate'],
          },
        },
        options: [
          { name: '1:1 (Square)', value: '1:1' },
          { name: '16:9 (Landscape)', value: '16:9' },
          { name: '9:16 (Portrait / Shorts)', value: '9:16' },
        ],
        description: 'Output aspect ratio',
      },
      {
        displayName: 'Wait for Completion',
        name: 'waitForCompletion',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            operation: ['generate'],
          },
        },
        description:
          'Whether to poll until the render finishes and return the final URL, instead of returning a job ID immediately',
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: {
            operation: ['generate'],
          },
        },
        options: [
          {
            displayName: 'Callback URL',
            name: 'callbackUrl',
            type: 'string',
            default: '',
            placeholder: 'https://your.app/webhook',
            description:
              'URL the API posts the result to when the render finishes',
          },
        ],
      },
      {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['getResult'],
          },
        },
        description: 'The job ID returned by a Generate operation',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('facelessVideoApi');
    const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;

        if (operation === 'generate') {
          const segmentRows = this.getNodeParameter(
            'segments.segment',
            i,
            [],
          ) as IDataObject[];
          if (segmentRows.length === 0) {
            throw new NodeOperationError(
              this.getNode(),
              'At least one segment is required',
              {
                itemIndex: i,
              },
            );
          }

          const voice = this.getNodeParameter('voice', i, 'alloy') as string;
          const aspect = this.getNodeParameter('aspect', i, '9:16') as string;
          const additionalFields = this.getNodeParameter(
            'additionalFields',
            i,
            {},
          ) as IDataObject;

          const body: IDataObject = {
            segments: segmentRows.map((row) => {
              const segment: IDataObject = { text: row.text };
              if (row.imageUrl) {
                segment.image_url = row.imageUrl;
              }
              return segment;
            }),
            voice,
            aspect,
          };
          if (additionalFields.callbackUrl) {
            body.callback_url = additionalFields.callbackUrl;
          }

          const created =
            (await this.helpers.httpRequestWithAuthentication.call(
              this,
              'facelessVideoApi',
              {
                method: 'POST',
                url: `${baseUrl}/v1/videos`,
                body,
                json: true,
              } as IHttpRequestOptions,
            )) as IDataObject;

          const waitForCompletion = this.getNodeParameter(
            'waitForCompletion',
            i,
            true,
          ) as boolean;
          if (!waitForCompletion) {
            returnData.push({ json: created, pairedItem: i });
            continue;
          }

          const jobId = created.job_id;
          if (typeof jobId !== 'string' || jobId.length === 0) {
            throw new NodeOperationError(
              this.getNode(),
              'Faceless Video API response did not include a valid job_id',
              { itemIndex: i },
            );
          }
          let result = created;
          let finished = false;
          for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
            await sleep(POLL_DELAY_MS);
            result = (await this.helpers.httpRequestWithAuthentication.call(
              this,
              'facelessVideoApi',
              {
                method: 'GET',
                url: `${baseUrl}/v1/videos/${jobId}`,
                json: true,
              } as IHttpRequestOptions,
            )) as IDataObject;
            const status = result.status as string;
            if (status === 'done') {
              finished = true;
              break;
            }
            if (status === 'failed') {
              throw new NodeOperationError(
                this.getNode(),
                `Render job ${jobId} failed: ${(result.error as string) ?? 'unknown error'}`,
                { itemIndex: i },
              );
            }
          }
          if (!finished) {
            throw new NodeOperationError(
              this.getNode(),
              `Timed out waiting for render job ${jobId}`,
              { itemIndex: i },
            );
          }
          returnData.push({ json: result, pairedItem: i });
        } else {
          const jobId = this.getNodeParameter('jobId', i) as string;
          const result = (await this.helpers.httpRequestWithAuthentication.call(
            this,
            'facelessVideoApi',
            {
              method: 'GET',
              url: `${baseUrl}/v1/videos/${jobId}`,
              json: true,
            } as IHttpRequestOptions,
          )) as IDataObject;
          returnData.push({ json: result, pairedItem: i });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: i,
          });
          continue;
        }
        throw new NodeApiError(this.getNode(), error as JsonObject, {
          itemIndex: i,
        });
      }
    }

    return [returnData];
  }
}
