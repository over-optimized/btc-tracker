# MCP Server Configuration (GitHub Integration)

The project includes configuration for GitHub MCP server integration with Claude Code, providing enhanced repository management capabilities.

## User-Level Setup (One-time Configuration)

1. **Install GitHub MCP Server** (if not already installed):

   ```bash
   npm install -g @modelcontextprotocol/server-github
   ```

2. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope (or `public_repo` for public repositories only)
   - Copy the generated token securely

3. **Configure User Settings** (`~/.claude/settings.json`):

   ```json
   {
     "enabledMcpServers": ["github"],
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

4. **Restart Claude Code** to load the new configuration

## Project-Level Setup (Per Developer)

Create `.claude/settings.local.json` for project-specific tool permissions:

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm lint:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm build)",
      "Bash(pnpm quality)",
      "Bash(pnpm ci)",
      "Bash(rm:*)"
    ]
  }
}
```

**Important**: The `.claude/settings.local.json` file is gitignored to keep personal permissions local to each developer.

## Security Best Practices

- **Never commit tokens**: User-level settings with tokens stay in `~/.claude/settings.json`
- **Project permissions only**: `.claude/settings.local.json` contains no sensitive data
- **Token scopes**: Use minimal required scopes (`public_repo` for public repositories)
- **Regular rotation**: Rotate GitHub tokens periodically for security
