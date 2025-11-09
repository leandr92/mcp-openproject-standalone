#!/usr/bin/env node

/**
 * Standalone MCP Server for OpenProject
 * 
 * This server runs locally and connects to OpenProject API
 * No Netlify or cloud deployment required
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// OpenProject API Client
class OpenProjectClient {
  constructor(baseURL, apiKey) {
    this.base = baseURL.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async request(path, options = {}) {
    const url = `${this.base}${path}`;
    const auth = Buffer.from(`apikey:${this.apiKey}`).toString('base64');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenProject API ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async listProjects() {
    const data = await this.request('/api/v3/projects');
    return data._embedded?.elements || [];
  }

  async getProject(projectId) {
    return await this.request(`/api/v3/projects/${projectId}`);
  }

  async listWorkPackages(projectId) {
    const data = await this.request(`/api/v3/projects/${projectId}/work_packages`);
    return data._embedded?.elements || [];
  }

  async getWorkPackage(workPackageId) {
    return await this.request(`/api/v3/work_packages/${workPackageId}`);
  }

  async createWorkPackage(projectId, workPackageData) {
    const payload = {
      subject: workPackageData.subject,
      description: workPackageData.description,
      _links: {
        project: {
          href: `/api/v3/projects/${projectId}`,
        },
        type: {
          href: `/api/v3/types/${workPackageData.typeId || 1}`,
        },
      },
    };

    if (workPackageData.assigneeId) {
      payload._links.assignee = {
        href: `/api/v3/users/${workPackageData.assigneeId}`,
      };
    }

    if (workPackageData.statusId) {
      payload._links.status = {
        href: `/api/v3/statuses/${workPackageData.statusId}`,
      };
    }

    return await this.request('/api/v3/work_packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateWorkPackage(workPackageId, workPackageData, lockVersion) {
    const payload = {
      lockVersion,
      ...workPackageData,
    };

    return await this.request(`/api/v3/work_packages/${workPackageId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

// Initialize OpenProject client
const baseURL = process.env.OPENPROJECT_BASE_URL || process.env.OPENPROJECT_URL;
const apiKey = process.env.OPENPROJECT_API_KEY || process.env.OPENPROJECT_API_TOKEN;

if (!baseURL || !apiKey) {
  console.error('Error: OPENPROJECT_BASE_URL and OPENPROJECT_API_KEY must be set');
  process.exit(1);
}

const client = new OpenProjectClient(baseURL, apiKey);

// Create MCP Server
const server = new Server(
  {
    name: 'mcp-openproject-standalone',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_projects',
      description: 'List all visible OpenProject projects',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_project',
      description: 'Get details of a specific project by ID',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The ID of the project',
          },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'list_work_packages',
      description: 'List all work packages in a given project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The ID of the project',
          },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'get_work_package',
      description: 'Get details of a specific work package by ID',
      inputSchema: {
        type: 'object',
        properties: {
          work_package_id: {
            type: 'number',
            description: 'The ID of the work package',
          },
        },
        required: ['work_package_id'],
      },
    },
    {
      name: 'create_work_package',
      description: 'Create a new work package in a project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The ID of the project',
          },
          subject: {
            type: 'string',
            description: 'The subject/title of the work package',
          },
          description: {
            type: 'string',
            description: 'The description of the work package',
          },
          type_id: {
            type: 'number',
            description: 'The type ID (default: 1)',
          },
          assignee_id: {
            type: 'number',
            description: 'The ID of the assignee user',
          },
          status_id: {
            type: 'number',
            description: 'The ID of the status',
          },
        },
        required: ['project_id', 'subject'],
      },
    },
    {
      name: 'update_work_package',
      description: 'Update an existing work package',
      inputSchema: {
        type: 'object',
        properties: {
          work_package_id: {
            type: 'number',
            description: 'The ID of the work package',
          },
          lock_version: {
            type: 'number',
            description: 'The lock version (required for updates)',
          },
          subject: {
            type: 'string',
            description: 'The subject/title of the work package',
          },
          description: {
            type: 'string',
            description: 'The description of the work package',
          },
          status_id: {
            type: 'number',
            description: 'The ID of the status',
          },
        },
        required: ['work_package_id', 'lock_version'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    switch (name) {
      case 'list_projects':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await client.listProjects(), null, 2),
            },
          ],
        };

      case 'get_project':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await client.getProject(args.project_id), null, 2),
            },
          ],
        };

      case 'list_work_packages':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.listWorkPackages(args.project_id),
                null,
                2
              ),
            },
          ],
        };

      case 'get_work_package':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.getWorkPackage(args.work_package_id),
                null,
                2
              ),
            },
          ],
        };

      case 'create_work_package':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.createWorkPackage(args.project_id, {
                  subject: args.subject,
                  description: args.description,
                  typeId: args.type_id,
                  assigneeId: args.assignee_id,
                  statusId: args.status_id,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'update_work_package':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.updateWorkPackage(
                  args.work_package_id,
                  {
                    subject: args.subject,
                    description: args.description,
                    statusId: args.status_id,
                  },
                  args.lock_version
                ),
                null,
                2
              ),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP OpenProject Standalone Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

