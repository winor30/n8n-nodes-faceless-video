import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class FacelessVideoApi implements ICredentialType {
  name = 'facelessVideoApi';

  displayName = 'Faceless Video API';

  documentationUrl = 'https://github.com/winor30/n8n-nodes-faceless-video';

  icon: Icon = {
    light: 'file:../nodes/FacelessVideo/facelessVideo.svg',
    dark: 'file:../nodes/FacelessVideo/facelessVideo.dark.svg',
  };

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://faceless-video-api.onrender.com',
      placeholder: 'https://faceless-video-api.onrender.com',
      description:
        'Base URL of the Faceless Video API, with no trailing slash. Defaults to the hosted beta; change it if you self-host.',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description:
        'Need a key? Request a free beta API key: https://docs.google.com/forms/d/e/1FAIpQLScYBDJJcQLgNq8m23VjpSDyqENROfkFypYGT_rCec2VuGCYVw/viewform',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/v1/ping',
      method: 'GET',
    },
  };
}
