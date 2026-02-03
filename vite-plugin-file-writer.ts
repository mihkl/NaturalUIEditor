import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

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

        next();
      });
    },
  };
}
