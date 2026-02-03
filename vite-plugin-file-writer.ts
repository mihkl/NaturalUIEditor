import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that adds an API endpoint for writing files during development.
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
