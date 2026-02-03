import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface GitHubConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  apiUrl: string;
}

function loadGitHubConfig(projectRoot: string): GitHubConfig | null {
  const configPath = path.join(projectRoot, 'github.config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!config.owner || !config.repo) {
      return null;
    }
    return {
      owner: config.owner,
      repo: config.repo,
      baseBranch: config.baseBranch || 'main',
      apiUrl: config.apiUrl || 'https://api.github.com',
    };
  } catch {
    return null;
  }
}

// GitHub API helpers
async function githubApi(
  config: GitHubConfig,
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${config.apiUrl}/repos/${config.owner}/${config.repo}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
}

async function getBaseBranchSha(config: GitHubConfig, token: string): Promise<string> {
  const response = await githubApi(config, token, `/git/ref/heads/${config.baseBranch}`);
  if (!response.ok) {
    throw new Error(`Failed to get base branch: ${config.baseBranch}`);
  }
  const data = await response.json();
  return data.object.sha;
}

async function createBranch(config: GitHubConfig, token: string, branchName: string, sha: string): Promise<void> {
  const response = await githubApi(config, token, '/git/refs', {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create branch: ${error.message}`);
  }
}

async function getFileSha(config: GitHubConfig, token: string, filePath: string, branch: string): Promise<string | null> {
  const response = await githubApi(config, token, `/contents/${filePath}?ref=${branch}`);
  if (!response.ok) {
    return null; // File doesn't exist
  }
  const data = await response.json();
  return data.sha;
}

async function updateFile(
  config: GitHubConfig,
  token: string,
  filePath: string,
  content: string,
  message: string,
  branch: string,
  fileSha: string | null
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (fileSha) {
    body.sha = fileSha;
  }

  const response = await githubApi(config, token, `/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update file: ${error.message}`);
  }
}

async function createPullRequest(
  config: GitHubConfig,
  token: string,
  branchName: string,
  title: string,
  body: string
): Promise<string> {
  const response = await githubApi(config, token, '/pulls', {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: config.baseBranch,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create PR: ${error.message}`);
  }

  const pr = await response.json();
  return pr.html_url;
}

/**
 * Vite plugin that adds API endpoints for reading and writing files during development.
 * This enables live preview by saving modified files, triggering HMR.
 */
export function fileWriterPlugin(): Plugin {
  let projectRoot: string;

  return {
    name: 'file-writer',
    configResolved(config) {
      projectRoot = config.root;
    },
    configureServer(server) {
      console.log('[file-writer] Plugin initialized');
      server.middlewares.use(async (req, res, next) => {
        // Read file endpoint - returns raw file content without Vite transformations
        if (req.url?.startsWith('/__read-file?') && req.method === 'GET') {
          try {
            const url = new URL(req.url, 'http://localhost');
            const filePath = url.searchParams.get('path');

            if (!filePath) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing path parameter' }));
              return;
            }

            // Security: only allow reading from src directory
            const normalizedPath = path.normalize(filePath).replace(/^[/\\]/, '');
            if (!normalizedPath.startsWith('src')) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Can only read from src directory' }));
              return;
            }

            const fullPath = path.join(projectRoot, normalizedPath);

            if (!fs.existsSync(fullPath)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'File not found' }));
              return;
            }

            const content = fs.readFileSync(fullPath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(content);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(error) }));
          }
          return;
        }

        if (req.url === '/__write-file' && req.method === 'POST') {
          console.log('[file-writer] Received write request');
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { filePath, content } = JSON.parse(body);

              // Security: only allow writing to src directory
              const normalizedPath = path.normalize(filePath).replace(/^[/\\]/, '');
              if (!normalizedPath.startsWith('src')) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Can only write to src directory' }));
                return;
              }

              const fullPath = path.join(projectRoot, normalizedPath);

              // Backup original file
              const backupPath = fullPath + '.backup';
              if (fs.existsSync(fullPath) && !fs.existsSync(backupPath)) {
                fs.copyFileSync(fullPath, backupPath);
              }

              // Write the new content
              fs.writeFileSync(fullPath, content, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: normalizedPath }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
          });
          return;
        }

        if (req.url === '/__revert-file' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { filePath } = JSON.parse(body);

              const normalizedPath = path.normalize(filePath).replace(/^[/\\]/, '');
              if (!normalizedPath.startsWith('src')) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Can only revert src files' }));
                return;
              }

              const fullPath = path.join(projectRoot, normalizedPath);
              const backupPath = fullPath + '.backup';

              if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, fullPath);
                fs.unlinkSync(backupPath);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, reverted: true }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'No backup found' }));
              }
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
          });
          return;
        }

        // Create PR endpoint - creates a branch, commits changes, and opens a PR via GitHub API
        if (req.url === '/__create-pr' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { filePath, content, description } = JSON.parse(body);

              const normalizedPath = path.normalize(filePath).replace(/^[/\\]/, '').replace(/\\/g, '/');
              if (!normalizedPath.startsWith('src')) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Can only create PRs for src files' }));
                return;
              }

              // Load GitHub config
              const githubConfig = loadGitHubConfig(projectRoot);
              if (!githubConfig) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'GitHub not configured. Please fill in github.config.json with your owner and repo.'
                }));
                return;
              }

              // Get GitHub token from environment
              const githubToken = process.env.GITHUB_TOKEN;
              if (!githubToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'GITHUB_TOKEN not set in .env file. Generate a token at https://github.com/settings/tokens with repo scope.'
                }));
                return;
              }

              // Generate a branch name based on the file and timestamp
              const fileName = path.basename(normalizedPath, path.extname(normalizedPath));
              const timestamp = Date.now();
              const branchName = `ui-edit/${fileName}-${timestamp}`;

              // 1. Get the SHA of the base branch
              const baseSha = await getBaseBranchSha(githubConfig, githubToken);

              // 2. Create a new branch from the base
              await createBranch(githubConfig, githubToken, branchName, baseSha);

              // 3. Get the current file SHA (needed for updates)
              const fileSha = await getFileSha(githubConfig, githubToken, normalizedPath, branchName);

              // 4. Update the file with new content
              const commitMessage = description || `UI edit: ${fileName}`;
              await updateFile(
                githubConfig,
                githubToken,
                normalizedPath,
                content,
                commitMessage,
                branchName,
                fileSha
              );

              // 5. Create the pull request
              const prTitle = `UI Edit: ${fileName}`;
              const prBody = `## Changes\n\n${description || 'UI modifications made via Natural UI Editor'}\n\n---\n*Created with Natural UI Editor*`;

              const prUrl = await createPullRequest(
                githubConfig,
                githubToken,
                branchName,
                prTitle,
                prBody
              );

              // Delete the backup file since changes are now in GitHub
              const fullPath = path.join(projectRoot, normalizedPath);
              const backupPath = fullPath + '.backup';
              if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                prUrl,
                branch: branchName
              }));
            } catch (error) {
              console.error('[file-writer] PR creation error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(error) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
