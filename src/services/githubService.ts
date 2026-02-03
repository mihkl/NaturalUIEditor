import { Octokit } from '@octokit/rest';
import type { CommitInfo } from '@/types';

let octokit: Octokit | null = null;

/**
 * Initialize the GitHub client with a token
 */
export function initGitHub(token: string): void {
  octokit = new Octokit({ auth: token });
}

/**
 * Get the contents of a file from GitHub
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<{ content: string; sha: string }> {
  if (!octokit) throw new Error('GitHub not initialized');

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(response.data) || response.data.type !== 'file') {
    throw new Error('Path is not a file');
  }

  const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
  return { content, sha: response.data.sha };
}

/**
 * Commit a file change to GitHub
 */
export async function commitFile(info: CommitInfo): Promise<{ commitUrl: string }> {
  if (!octokit) throw new Error('GitHub not initialized');

  // Get current file SHA if not provided
  let sha = info.sha;
  if (!sha) {
    try {
      const existing = await getFileContent(info.owner, info.repo, info.filePath, info.branch);
      sha = existing.sha;
    } catch {
      // File doesn't exist, that's fine for new files
    }
  }

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: info.owner,
    repo: info.repo,
    path: info.filePath,
    message: info.message,
    content: Buffer.from(info.content).toString('base64'),
    branch: info.branch,
    sha,
  });

  return {
    commitUrl: response.data.commit.html_url || '',
  };
}

/**
 * Create a new branch from the default branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string = 'main'
): Promise<void> {
  if (!octokit) throw new Error('GitHub not initialized');

  // Get the SHA of the base branch
  const baseRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  // Create new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseRef.data.object.sha,
  });
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string = 'main'
): Promise<{ prUrl: string; prNumber: number }> {
  if (!octokit) throw new Error('GitHub not initialized');

  const response = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  });

  return {
    prUrl: response.data.html_url,
    prNumber: response.data.number,
  };
}
