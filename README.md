# ServiceNow AI Agent MCP Connector

Connect autonomous AI coding agents (Google Antigravity, Claude, Cursor, ChatGPT, etc.) directly to your ServiceNow instance via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) and [NowAIKit](https://nowaikit.com).

This repository provides setup instructions, configuration templates, troubleshooting guides, and automated auth fixers to connect your AI assistant to ServiceNow without creating or deploying custom scoped applications.

---

## ⚡ Architecture Overview

```
+--------------------------------------------------------+
|                      AI Assistant                      |
|       (Google Antigravity / Claude / Cursor)           |
+--------------------------------------------------------+
                           |
                     (MCP Protocol)
                           v
+--------------------------------------------------------+
|                NowAIKit MCP Server                     |
|           (500+ Tools & Capabilities)                  |
+--------------------------------------------------------+
                           |
                    (ServiceNow REST API)
                           v
+--------------------------------------------------------+
|                  ServiceNow Instance                   |
|          (PDI / Enterprise: Washington/Xanadu)         |
|                                                        |
|   * ITSM (Incidents, Problems, Changes)               |
|   * CMDB & Service Mapping                             |
|   * Service Catalog & Workflows                        |
|   * Background Scripts & Table Queries                 |
+--------------------------------------------------------+
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or newer
- **A ServiceNow Instance**: Personal Developer Instance (PDI) from [developer.servicenow.com](https://developer.servicenow.com) or enterprise instance.

### 2. Install NowAIKit MCP Server
Install `nowaikit` globally using npm:

```bash
npm install -g nowaikit
```

### 3. Handle Modern ServiceNow Basic Auth Restriction
In modern ServiceNow releases (Washington DC, Xanadu, and newer), **Basic Auth Restriction** is enforced by default (`glide.authenticate.basic_auth.restriction.enforce = true`). Any incoming Basic Auth API request from an account without the `snc_basic_auth_api_access` role is blocked with a `401 Unauthorized`.

To resolve this automatically:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate your instance URL and admin credentials in `.env`.
3. Run the automated role assigner:
   ```bash
   npm run fix:pdi-auth
   ```
4. Test the connection:
   ```bash
   npm run test:connection
   ```

---

## ⚙️ MCP Client Configuration

Add the server definition to your MCP client configuration file:

### For Google Antigravity (`~/.gemini/config/mcp_config.json`)
```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["<PATH_TO_GLOBAL_NPM>/node_modules/nowaikit/dist/server.js"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://devXXXXX.service-now.com",
        "SERVICENOW_AUTH_METHOD": "basic",
        "SERVICENOW_BASIC_USERNAME": "admin",
        "SERVICENOW_BASIC_PASSWORD": "your-password",
        "WRITE_ENABLED": "true",
        "SCRIPTING_ENABLED": "true",
        "CMDB_WRITE_ENABLED": "true",
        "MCP_TOOL_PACKAGE": "full"
      }
    }
  }
}
```

> **Note on Windows**: Find your global node modules path by running `npm root -g` (typically `C:\Users\<username>\AppData\Roaming\npm\node_modules`).

### For Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "servicenow": {
      "command": "npx",
      "args": ["-y", "nowaikit@latest"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://devXXXXX.service-now.com",
        "SERVICENOW_BASIC_USERNAME": "admin",
        "SERVICENOW_BASIC_PASSWORD": "your-password",
        "WRITE_ENABLED": "true",
        "SCRIPTING_ENABLED": "true"
      }
    }
  }
}
```

---

## 🔒 Security Best Practices

1. **Never Commit Secrets**: Ensure `.env` and `mcp_config.json` containing live credentials are listed in `.gitignore`.
2. **Permission Tiers**: By default, write access is disabled. Only set `WRITE_ENABLED=true` and `SCRIPTING_ENABLED=true` if you trust the agent to modify instance data.
3. **Dedicated Integration User**: For production instances, avoid using the root `admin` user. Create a dedicated service account with granular ACLs and OAuth 2.0 authentication.

---

## 💡 Example Prompt Ideas

Once connected, you can interact with ServiceNow directly from your AI agent chat:

- *"List all open incidents with Critical priority and summarize their root causes."*
- *"Check the schema and business rules on the `change_request` table."*
- *"Find all CI records for server DB-01 in the CMDB."*
- *"Generate resolution notes for incident INC0000060 and close it."*
- *"Execute a background diagnostic script to verify system property values."*

---

## 📄 License
MIT
