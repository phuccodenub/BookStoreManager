#!/usr/bin/env node

/**
 * Realtime listener for BookStoreManager backend.
 *
 * Usage:
 * 1) Paste tokens into CONFIG.tokens below.
 * 2) Run: node scripts/realtime-listener.mjs
 *
 * Optional env overrides:
 * - API_BASE_URL=http://127.0.0.1:4000
 * - SOCKET_PATH=/socket.io
 */

const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:4000',
  socketPath: process.env.SOCKET_PATH || '/socket.io',
  transports: ['websocket'],
  tokens: {
    admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDViNzIyYy1kOWQ1LTQxNjEtYmE4OS1hMDg2MTZmZTRmZjQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzU1ODQyNDQsImV4cCI6MTc3NTU4NTE0NH0.E0r2Lxy_fl1OTNmtW0AyEB5QLxcysdfXS-Nzh6eVNwc',
    staff: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YmY5ZmFlZC1lNDFjLTRmNTUtODI3OS0wNWUwYTQ1OWM0MDIiLCJyb2xlIjoic3RhZmYiLCJpYXQiOjE3NzU1ODQ2MTAsImV4cCI6MTc3NTU4NTUxMH0.dUIrQy2T4zHNR4a3j8dT3h6RHbtrZU8tVn-ukX_58d0',
    customer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YjhiYjU0MC02ZGQ3LTQzZDAtYTM5MS03MmQ3NWVkZTkzODkiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NzU1ODQ2MjUsImV4cCI6MTc3NTU4NTUyNX0.RnQDkS_q3H7VyslGFiLPra945sXtgTfwjdVVfXWjkUE',
  },
};

const EVENTS = [
  'order:created',
  'order:updated',
  'order:statusChanged',
  'payment:updated',
  'payment:success',
  'inventory:lowStock',
  'inventory:low-stock',
  'notification:new',
  'connect_error',
  'disconnect',
];

function now() {
  return new Date().toISOString();
}

function redactToken(token) {
  if (!token || token.length < 16) return token;
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function parseCliTokenArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    if (!value) continue;
    if (key === 'admin') out.admin = value;
    if (key === 'staff') out.staff = value;
    if (key === 'customer') out.customer = value;
  }
  return out;
}

function normalizeToken(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function resolveTokens() {
  const cli = parseCliTokenArgs(process.argv.slice(2));
  const candidates = {
    admin: [cli.admin, process.env.ADMIN_TOKEN, CONFIG.tokens.admin],
    staff: [cli.staff, process.env.STAFF_TOKEN, CONFIG.tokens.staff],
    customer: [cli.customer, process.env.CUSTOMER_TOKEN, CONFIG.tokens.customer],
  };

  const result = {};
  for (const [role, values] of Object.entries(candidates)) {
    const token = values
      .map(normalizeToken)
      .find((v) => v && !v.startsWith('PASTE_'));
    if (token) result[role] = token;
  }
  return result;
}

async function main() {
  let io;
  try {
    ({ io } = await import('socket.io-client'));
  } catch {
    console.error('Missing dependency: socket.io-client');
    console.error('Install it with: npm i -D socket.io-client');
    process.exit(1);
  }

  const resolvedTokens = resolveTokens();
  const roleEntries = Object.entries(resolvedTokens)
    .filter(([, token]) => token && !token.startsWith('PASTE_'));

  if (roleEntries.length === 0) {
    console.error('No valid token found.');
    console.error('Provide at least one token via one of these options:');
    console.error('1) Edit CONFIG.tokens in this file');
    console.error('2) Env vars: ADMIN_TOKEN / STAFF_TOKEN / CUSTOMER_TOKEN');
    console.error('3) CLI args: --admin=<token> --staff=<token> --customer=<token>');
    console.error('PowerShell example:');
    console.error('$env:CUSTOMER_TOKEN="<token>"; node scripts/realtime-listener.mjs');
    process.exit(1);
  }

  console.log(`[${now()}] Starting realtime listeners`);
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Socket path: ${CONFIG.socketPath}`);

  const sockets = [];

  for (const [role, token] of roleEntries) {
    console.log(`[${now()}] Connecting ${role} with token ${redactToken(token)}`);

    const socket = io(CONFIG.baseUrl, {
      path: CONFIG.socketPath,
      auth: { token },
      transports: CONFIG.transports,
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(`[${now()}] [${role}] connected: ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`[${now()}] [${role}] connect_error: ${err?.message || err}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[${now()}] [${role}] disconnect: ${reason}`);
    });

    for (const eventName of EVENTS) {
      if (eventName === 'connect_error' || eventName === 'disconnect') continue;
      socket.on(eventName, (payload) => {
        console.log(`[${now()}] [${role}] ${eventName}`);
        console.log(JSON.stringify(payload, null, 2));
      });
    }

    sockets.push(socket);
  }

  process.on('SIGINT', () => {
    console.log(`\n[${now()}] SIGINT received, closing sockets...`);
    for (const s of sockets) s.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`\n[${now()}] SIGTERM received, closing sockets...`);
    for (const s of sockets) s.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
