#!/usr/bin/env node

/**
 * Standalone MCP Server for OpenProject
 * 
 * This server runs locally and connects to OpenProject API
 * No Netlify or cloud deployment required
 */

import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Auto-install dependencies if node_modules doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nodeModulesPath = join(__dirname, 'node_modules');
const packageJsonPath = join(__dirname, 'package.json');

// Try to import SDK modules, install dependencies if needed
let Server, StdioServerTransport, CallToolRequestSchema, ListToolsRequestSchema;

async function loadSDK() {
  try {
    const sdk = await import('@modelcontextprotocol/sdk/server/index.js');
    const transport = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const types = await import('@modelcontextprotocol/sdk/types.js');
    
    Server = sdk.Server;
    StdioServerTransport = transport.StdioServerTransport;
    CallToolRequestSchema = types.CallToolRequestSchema;
    ListToolsRequestSchema = types.ListToolsRequestSchema;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && existsSync(packageJsonPath)) {
      console.error('Dependencies not found. Installing automatically...');
      try {
        execSync('npm install', {
          cwd: __dirname,
          stdio: 'inherit',
        });
        console.error('Dependencies installed successfully. Retrying import...');
        // Retry import after installation
        const sdk = await import('@modelcontextprotocol/sdk/server/index.js');
        const transport = await import('@modelcontextprotocol/sdk/server/stdio.js');
        const types = await import('@modelcontextprotocol/sdk/types.js');
        
        Server = sdk.Server;
        StdioServerTransport = transport.StdioServerTransport;
        CallToolRequestSchema = types.CallToolRequestSchema;
        ListToolsRequestSchema = types.ListToolsRequestSchema;
      } catch (installError) {
        console.error('Failed to install dependencies:', installError.message);
        process.exit(1);
      }
    } else {
      throw error;
    }
  }
}

await loadSDK();

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
    const allWorkPackages = [];
    let url = `/api/v3/projects/${projectId}/work_packages?pageSize=100`;
    
    while (url) {
      const data = await this.request(url);
      const elements = data._embedded?.elements || [];
      allWorkPackages.push(...elements);
      
      // Check if there's a next page
      if (data._links?.next?.href) {
        // Extract the path from the URL (handle both absolute and relative URLs)
        const nextHref = data._links.next.href;
        if (nextHref.startsWith('http://') || nextHref.startsWith('https://')) {
          const nextUrl = new URL(nextHref);
          url = nextUrl.pathname + nextUrl.search;
        } else {
          // Relative URL
          url = nextHref;
        }
      } else {
        url = null;
      }
    }
    
    return allWorkPackages;
  }

  async getWorkPackage(workPackageId) {
    return await this.request(`/api/v3/work_packages/${workPackageId}`);
  }

  async createWorkPackage(projectId, workPackageData) {
    const payload = {
      subject: workPackageData.subject,
      _links: {
        project: {
          href: `/api/v3/projects/${projectId}`,
        },
        type: {
          href: `/api/v3/types/${workPackageData.typeId || 1}`,
        },
      },
    };
    
    // Format description as OpenProject expects
    if (workPackageData.description) {
      payload.description = {
        format: 'markdown',
        raw: workPackageData.description,
      };
    }

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

    // Format description as OpenProject expects
    // Always format description if it's provided, even if it's already an object
    if (payload.description !== undefined) {
      if (typeof payload.description === 'string') {
        payload.description = {
          format: 'markdown',
          raw: payload.description,
        };
      } else if (typeof payload.description === 'object' && payload.description !== null) {
        // If it's already an object, ensure it has the correct format
        if (!payload.description.format) {
          payload.description.format = 'markdown';
        }
        if (!payload.description.raw && payload.description.raw !== '') {
          // If raw is missing, try to extract from html or use empty string
          payload.description.raw = payload.description.html || '';
        }
      }
    }

    // Check workflow if statusId is being changed
    if (payload.statusId) {
      // Get available statuses for this work package
      const workflowInfo = await this.getAvailableStatuses(workPackageId);
      const newStatusId = String(payload.statusId);
      
      // Check if the new status is in the list of available statuses
      const isStatusAvailable = workflowInfo.availableStatuses.some(
        status => String(status.id) === newStatusId
      );
      
      // Also check if it's the current status (no change needed)
      const isCurrentStatus = String(workflowInfo.currentStatus.id) === newStatusId;
      
      if (!isStatusAvailable && !isCurrentStatus) {
        const availableStatusNames = workflowInfo.availableStatuses
          .map(s => `${s.name} (ID: ${s.id})`)
          .join(', ');
        
        throw new Error(
          `Cannot set status ID ${payload.statusId} for work package ${workPackageId}. ` +
          `Current status: ${workflowInfo.currentStatus.name} (ID: ${workflowInfo.currentStatus.id}). ` +
          `Available statuses: ${availableStatusNames || 'none'}. ` +
          `Please use get_available_statuses to see valid status transitions.`
        );
      }
      
      // Convert statusId to _links.status.href format
      payload._links = {
        ...payload._links,
        status: {
          href: `/api/v3/statuses/${payload.statusId}`,
        },
      };
      delete payload.statusId;
    }

    // Log the payload for debugging (only in development)
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.error('[OpenProject] Updating work package:', JSON.stringify(payload, null, 2));
    }

    return await this.request(`/api/v3/work_packages/${workPackageId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async listStatuses() {
    const data = await this.request('/api/v3/statuses');
    return data._embedded?.elements || [];
  }

  async getWorkPackageForm(workPackageId) {
    // Get the form schema which contains available transitions
    return await this.request(`/api/v3/work_packages/${workPackageId}/form`);
  }

  async getAvailableStatuses(workPackageId) {
    // Get the work package to see current status
    const workPackage = await this.getWorkPackage(workPackageId);
    const currentStatusId = workPackage._links?.status?.href?.match(/\/(\d+)$/)?.[1];
    const currentStatusName = workPackage._links?.status?.title;
    
    // Get the form which contains available status transitions
    const form = await this.getWorkPackageForm(workPackageId);
    
    // Extract available statuses from the form schema
    // Try different possible paths in the form structure
    const availableStatuses = [];
    
    // Path 1: Standard form schema path
    if (form._embedded?.schema?.status?._links?.allowedValues) {
      const statuses = form._embedded.schema.status._links.allowedValues;
      for (const status of statuses) {
        const statusId = status.href?.match(/\/(\d+)$/)?.[1];
        if (statusId) {
          availableStatuses.push({
            id: statusId,
            name: status.title || status.name,
            href: status.href,
          });
        }
      }
    }
    // Path 2: Alternative form structure
    else if (form._embedded?.schema?.status?.writable && form._embedded?.schema?.status?._links?.allowedValues) {
      const statuses = form._embedded.schema.status._links.allowedValues;
      for (const status of statuses) {
        const statusId = status.href?.match(/\/(\d+)$/)?.[1];
        if (statusId) {
          availableStatuses.push({
            id: statusId,
            name: status.title || status.name,
            href: status.href,
          });
        }
      }
    }
    
    return {
      currentStatus: {
        id: currentStatusId,
        name: currentStatusName,
        href: workPackage._links?.status?.href,
      },
      availableStatuses: availableStatuses,
      workflow: {
        description: 'Available status transitions for this work package',
        totalAvailable: availableStatuses.length,
      },
    };
  }

  async addComment(workPackageId, comment) {
    const payload = {
      comment: {
        format: 'markdown',
        raw: comment,
      },
    };

    return await this.request(`/api/v3/work_packages/${workPackageId}/activities`, {
      method: 'POST',
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
      description: 'Update an existing work package. Automatically validates status transitions according to OpenProject workflow rules. If you try to set an invalid status (e.g., directly from "Новый" to "Выполнено"), it will return an error with available statuses. Use get_available_statuses to see valid transitions.',
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
            description: 'The ID of the status. Must be a valid status transition according to OpenProject workflow. Use get_available_statuses to see which statuses can be set from the current status.',
          },
        },
        required: ['work_package_id', 'lock_version'],
      },
    },
    {
      name: 'list_statuses',
      description: 'List all available statuses in OpenProject',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_available_statuses',
      description: 'Get available status transitions for a specific work package (workflow). Returns current status and all statuses that can be set for this work package.',
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
      name: 'add_comment',
      description: 'Add a comment to a work package',
      inputSchema: {
        type: 'object',
        properties: {
          work_package_id: {
            type: 'number',
            description: 'The ID of the work package',
          },
          comment: {
            type: 'string',
            description: 'The comment text (markdown format)',
          },
        },
        required: ['work_package_id', 'comment'],
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
        const updateData = {};
        if (args.subject !== undefined) {
          updateData.subject = args.subject;
        }
        if (args.description !== undefined) {
          updateData.description = args.description;
        }
        if (args.status_id !== undefined) {
          updateData.statusId = args.status_id;
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.updateWorkPackage(
                  args.work_package_id,
                  updateData,
                  args.lock_version
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'list_statuses':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await client.listStatuses(), null, 2),
            },
          ],
        };

      case 'get_available_statuses':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.getAvailableStatuses(args.work_package_id),
                null,
                2
              ),
            },
          ],
        };

      case 'add_comment':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await client.addComment(args.work_package_id, args.comment),
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

