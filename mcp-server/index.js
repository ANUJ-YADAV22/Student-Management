#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { MongoClient } = require('mongodb');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const CSS_PATH = path.join(FRONTEND_DIR, 'src', 'index.css');
const MODEL_PATH = path.join(BACKEND_DIR, 'models', 'Student.js');

const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-dbtkl3p5efls73fecujg';
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_4yVUw688KHRxtV6Ww4NjVJ6vQYes';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://studentUser:2sDwJ9U6RTwB01cS@cluster0.ytjedrt.mongodb.net/studentDB?retryWrites=true&w=majority&appName=Cluster0';

let mongoClient = null;

async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db('studentDB');
}

function runGit(command) {
  try {
    return execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  } catch (err) {
    return `Git error: ${err.message}`;
  }
}

const server = new Server(
  {
    name: 'student-system-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'change_website_color',
        description:
          'Instantly update the color theme of the website (primary color, background color, hover colors), rebuilds the React app, commits, and pushes to GitHub so changes appear live.',
        inputSchema: {
          type: 'object',
          properties: {
            primaryColor: {
              type: 'string',
              description: 'Primary accent/button color (e.g. "#10b981", "#8b5cf6", "#e11d48", "#f59e0b", "purple", "crimson")'
            },
            primaryHoverColor: {
              type: 'string',
              description: 'Optional darker hover color for buttons (e.g. "#059669")'
            },
            backgroundColor: {
              type: 'string',
              description: 'Optional page background color (e.g. "#f8fafc", "#0f172a", "#fdf4ff")'
            },
            themeName: {
              type: 'string',
              description: 'Optional human-readable name of the theme (e.g. "Emerald Green", "Midnight Violet")'
            }
          },
          required: ['primaryColor']
        }
      },
      {
        name: 'manage_mongodb_schema',
        description:
          'Inspect or update the MongoDB Student schema (add fields, modify fields). Automatically updates Mongoose model, commits to GitHub, and triggers Render redeploy.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['view_schema', 'add_field'],
              description: 'Action to perform'
            },
            fieldName: {
              type: 'string',
              description: 'Name of the field to add (e.g. "gpa", "bloodGroup", "address", "enrollmentYear")'
            },
            fieldType: {
              type: 'string',
              enum: ['String', 'Number', 'Boolean', 'Date'],
              description: 'Data type of the field'
            },
            required: {
              type: 'boolean',
              description: 'Whether the field is mandatory'
            },
            defaultValue: {
              type: 'string',
              description: 'Optional default value'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'query_mongodb',
        description: 'Query MongoDB Atlas studentDB database directly (find students, count documents, get statistics).',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              default: 'students',
              description: 'Target collection name'
            },
            action: {
              type: 'string',
              enum: ['find', 'count', 'list_collections'],
              description: 'Query operation to run'
            },
            filter: {
              type: 'string',
              description: 'JSON string of MongoDB query filter, e.g. "{\\"department\\": \\"Computer Science\\"}"'
            },
            limit: {
              type: 'number',
              description: 'Max records to return (default 20)'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'mutate_mongodb',
        description: 'Directly insert, update, or delete records in MongoDB Atlas studentDB collection.',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              default: 'students',
              description: 'Target collection name'
            },
            operation: {
              type: 'string',
              enum: ['insert', 'update', 'delete'],
              description: 'Operation to perform'
            },
            query: {
              type: 'string',
              description: 'JSON filter string identifying document(s) to update/delete (e.g. "{\\"studentId\\": \\"ST101\\"}")'
            },
            data: {
              type: 'string',
              description: 'JSON string containing document to insert or update payload (e.g. "{\\"name\\": \\"New Name\\"}")'
            }
          },
          required: ['operation']
        }
      },
      {
        name: 'trigger_render_deploy',
        description: 'Trigger a fresh production build and deployment of the backend API on Render.',
        inputSchema: {
          type: 'object',
          properties: {
            clearCache: {
              type: 'boolean',
              default: false,
              description: 'Whether to clear build cache before building'
            }
          }
        }
      },
      {
        name: 'get_full_system_status',
        description: 'Returns real-time health and deployment metrics from Render backend, MongoDB Atlas, and GitHub repo.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'change_website_color') {
      const { primaryColor, primaryHoverColor, backgroundColor, themeName } = args;

      let cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

      // Replace --primary
      cssContent = cssContent.replace(/--primary:\s*[^;]+;/, `--primary: ${primaryColor};`);

      if (primaryHoverColor) {
        cssContent = cssContent.replace(/--primary-hover:\s*[^;]+;/, `--primary-hover: ${primaryHoverColor};`);
      } else {
        cssContent = cssContent.replace(/--primary-hover:\s*[^;]+;/, `--primary-hover: ${primaryColor};`);
      }

      if (backgroundColor) {
        cssContent = cssContent.replace(/--bg-main:\s*[^;]+;/, `--bg-main: ${backgroundColor};`);
      }

      fs.writeFileSync(CSS_PATH, cssContent, 'utf-8');

      // Rebuild frontend
      let buildOutput = '';
      try {
        buildOutput = execSync('npm run build', { cwd: FRONTEND_DIR, encoding: 'utf-8' });
      } catch (e) {
        buildOutput = 'Build warning: ' + e.message;
      }

      // Git Commit & Push
      const commitMsg = `style(theme): update website colors to ${themeName || primaryColor}`;
      runGit('git add frontend/src/index.css');
      const commitRes = runGit(`git commit -m "${commitMsg}"`);
      const pushRes = runGit('git push origin main');

      return {
        content: [
          {
            type: 'text',
            text: `✅ Website color updated successfully!\n- Primary Color: ${primaryColor}\n- Hover Color: ${primaryHoverColor || primaryColor}\n- Background: ${backgroundColor || 'default'}\n- Theme: ${themeName || 'Custom'}\n- Git Commit: ${commitRes}\n- GitHub Push: ${pushRes}\n\nYour changes are pushed to GitHub and will appear live on the website!`
          }
        ]
      };
    }

    if (name === 'manage_mongodb_schema') {
      const { action, fieldName, fieldType, required, defaultValue } = args;

      if (action === 'view_schema') {
        const modelContent = fs.readFileSync(MODEL_PATH, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Current Student Mongoose Schema:\n\n${modelContent}`
            }
          ]
        };
      }

      if (action === 'add_field') {
        if (!fieldName || !fieldType) {
          throw new Error('fieldName and fieldType are required to add a field');
        }

        let modelContent = fs.readFileSync(MODEL_PATH, 'utf-8');

        // Check if field already exists
        if (modelContent.includes(`${fieldName}:`)) {
          return {
            content: [
              {
                type: 'text',
                text: `Field "${fieldName}" already exists in the Student schema.`
              }
            ]
          };
        }

        const fieldDef = `    ${fieldName}: {\n      type: ${fieldType},\n      required: ${required ? 'true' : 'false'}${defaultValue !== undefined ? `,\n      default: ${JSON.stringify(defaultValue)}` : ''}\n    },\n`;

        // Insert before contact or timestamps
        const insertionPoint = modelContent.indexOf('contact:');
        if (insertionPoint !== -1) {
          modelContent = modelContent.slice(0, insertionPoint) + fieldDef + modelContent.slice(insertionPoint);
        } else {
          modelContent = modelContent.replace('  {\n    timestamps: true\n  }', `${fieldDef}  },\n  {\n    timestamps: true\n  }`);
        }

        fs.writeFileSync(MODEL_PATH, modelContent, 'utf-8');

        // Git commit & push
        runGit('git add backend/models/Student.js');
        const commitRes = runGit(`git commit -m "feat(schema): add ${fieldName} (${fieldType}) to Student model"`);
        const pushRes = runGit('git push origin main');

        // Auto-redeploy Render
        let renderDeployRes = 'Render redeploy triggered via Git push';
        try {
          const res = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RENDER_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clearCache: 'do_not_clear' })
          });
          const data = await res.json();
          renderDeployRes = `Render deploy started (ID: ${data.id}, Status: ${data.status})`;
        } catch (e) {
          renderDeployRes = `Note on Render deploy: ${e.message}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Added field "${fieldName}" (${fieldType}) to Student Schema!\n- Required: ${required ? 'Yes' : 'No'}\n- Git Commit: ${commitRes}\n- GitHub Push: ${pushRes}\n- Deployment: ${renderDeployRes}`
            }
          ]
        };
      }
    }

    if (name === 'query_mongodb') {
      const { collection = 'students', action, filter: rawFilter, limit = 20 } = args;
      const db = await getMongoDb();
      const coll = db.collection(collection);

      if (action === 'list_collections') {
        const list = await db.listCollections().toArray();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(list.map((c) => c.name), null, 2)
            }
          ]
        };
      }

      const queryFilter = rawFilter ? JSON.parse(rawFilter) : {};

      if (action === 'count') {
        const count = await coll.countDocuments(queryFilter);
        return {
          content: [{ type: 'text', text: `Document count in '${collection}': ${count}` }]
        };
      }

      if (action === 'find') {
        const results = await coll.find(queryFilter).limit(limit).toArray();
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
        };
      }
    }

    if (name === 'mutate_mongodb') {
      const { collection = 'students', operation, query: rawQuery, data: rawData } = args;
      const db = await getMongoDb();
      const coll = db.collection(collection);

      const queryObj = rawQuery ? JSON.parse(rawQuery) : {};
      const dataObj = rawData ? JSON.parse(rawData) : {};

      if (operation === 'insert') {
        const res = await coll.insertOne(dataObj);
        return {
          content: [{ type: 'text', text: `Inserted document with _id: ${res.insertedId}` }]
        };
      }

      if (operation === 'update') {
        const res = await coll.updateMany(queryObj, { $set: dataObj });
        return {
          content: [{ type: 'text', text: `Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}` }]
        };
      }

      if (operation === 'delete') {
        const res = await coll.deleteMany(queryObj);
        return {
          content: [{ type: 'text', text: `Deleted ${res.deletedCount} document(s)` }]
        };
      }
    }

    if (name === 'trigger_render_deploy') {
      const res = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clearCache: args.clearCache ? 'clear' : 'do_not_clear' })
      });
      const data = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: `Render Deployment Triggered:\n- ID: ${data.id}\n- Status: ${data.status}\n- Service: ${RENDER_SERVICE_ID}`
          }
        ]
      };
    }

    if (name === 'get_full_system_status') {
      let backendStatus = 'Checking...';
      try {
        const healthRes = await fetch('https://student-mgmt-api-d240.onrender.com/api/health');
        backendStatus = await healthRes.json();
      } catch (e) {
        backendStatus = `Health check error: ${e.message}`;
      }

      let dbInfo = {};
      try {
        const db = await getMongoDb();
        const studentCount = await db.collection('students').countDocuments();
        dbInfo = { status: 'Connected', database: 'studentDB', studentCount };
      } catch (e) {
        dbInfo = { status: 'Error', error: e.message };
      }

      const gitBranch = runGit('git branch --show-current');
      const gitCommit = runGit('git log -1 --pretty=format:"%h - %s (%cr)"');

      return {
        content: [
          {
            type: 'text',
            text: `=== SYSTEM STATUS ===\n\n[Application Tier (Render)]: https://student-mgmt-api-d240.onrender.com\n- Health: ${JSON.stringify(backendStatus, null, 2)}\n\n[Database Tier (MongoDB Atlas)]:\n- Status: ${JSON.stringify(dbInfo, null, 2)}\n\n[Git Repository]:\n- Branch: ${gitBranch}\n- Latest Commit: ${gitCommit}`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }]
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
