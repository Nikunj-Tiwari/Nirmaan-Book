/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function imageKitAuthPlugin() {
  return {
    name: 'imagekit-auth-plugin',
    configureServer(server) {
      server.middlewares.use('/api/imagekit-auth', (req, res) => {
        try {
          let privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
          if (!privateKey) {
            const fEnv = path.resolve(__dirname, 'functions/.env');
            if (fs.existsSync(fEnv)) {
              const content = fs.readFileSync(fEnv, 'utf8');
              const match = content.match(/IMAGEKIT_PRIVATE_KEY=["']?([^"'\r\n]+)/);
              if (match) privateKey = match[1];
            }
          }
          if (!privateKey) {
            privateKey = 'private_xy7vfRIhMB5sxs52d7Wh2Euogvg=';
          }

          const token = crypto.randomUUID();
          const expire = Math.floor(Date.now() / 1000) + 1800;
          const signature = crypto
            .createHmac('sha1', privateKey)
            .update(token + expire)
            .digest('hex');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ token, expire, signature }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), imageKitAuthPlugin()],
  server: {
    hmr: false,
  },
});
