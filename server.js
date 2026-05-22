const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express'); // Import express
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const { setupSwagger } = require('./src/lib/swagger');

app.prepare().then(() => {
  const expressApp = express(); // Create an Express app
  setupSwagger(expressApp); // Initialize Swagger UI with the Express app

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    const isExpressSwaggerRoute =
      parsedUrl.pathname === '/swagger' ||
      parsedUrl.pathname.startsWith('/swagger/') ||
      parsedUrl.pathname === '/swagger-json';

    // If the request is for the Express Swagger UI, let Express handle it.
    // Keep /swagger.html on Next so the static file in public/ is served.
    if (isExpressSwaggerRoute) {
      expressApp(req, res);
    } else {
      // Otherwise, let Next.js handle it
      handle(req, res, parsedUrl);
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Store io instance to use in API routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-admin', () => {
      socket.join('admin');
      console.log('Client joined admin room');
    });

    socket.on('join-partner', (partnerId) => {
      socket.join(`partner-${partnerId}`);
      console.log('Client joined partner room:', partnerId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
