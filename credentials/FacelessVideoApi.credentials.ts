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
      default: 'http://localhost:8000',
      placeholder: 'https://your-app.onrender.com',
      description:
        'Base URL of your Faceless Video API, with no trailing slash',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
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
