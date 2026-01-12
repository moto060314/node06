import express from 'express';
import path from 'path';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import http from 'http';
import { Server } from 'socket.io';
import pool from './src/database/connect.js';
import routes from './src/routes/main.js';
import expressLayouts from 'express-ejs-layouts';

import socketInit from './src/sockets/index.js';

const HOST = process.env.APP_HOST || '0.0.0.0';
const PORT = process.env.APP_PORT || 3000;
const APP_NAME = process.env.APP_NAME || 'dolync';
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret_key';

const MySQLSessionStore = MySQLStore(session);
const sessionStore = new MySQLSessionStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
  },
  pool
);

const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

app.use(sessionMiddleware);

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use((req, res, next) => {
  res.locals.APP_NAME = APP_NAME;
  res.locals.user = req.session.user || null;
  res.locals.linkify = (text) => {
    if (!text) return '';
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    return escaped.replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  };
  next();
});

app.use('/', routes);

socketInit(io);

server.listen(PORT, HOST, () => {
  console.log(`App running at http://${HOST}:${PORT}/`);
});

export const viteNodeApp = app;
