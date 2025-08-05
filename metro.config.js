const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle Node.js modules
config.resolver.alias = {
  ...config.resolver.alias,
  // Prevent Node.js built-in modules from being resolved
  'node:stream': false,
  'node:fs': false,
  'node:path': false,
  'node:url': false,
  'node:http': false,
  'node:https': false,
  'node:zlib': false,
  'node:buffer': false,
  'node:util': false,
  'node:events': false,
  'node:querystring': false,
  'node:crypto': false,
  'node:os': false,
  'node:child_process': false,
  'node:process': false,
  'node:vm': false,
  'node:module': false,
  'node:assert': false,
  'node:constants': false,
  'node:domain': false,
  'node:punycode': false,
  'node:tty': false,
  'node:string_decoder': false,
  'node:timers': false,
  'node:tls': false,
  'node:net': false,
  'node:dgram': false,
  'node:dns': false,
  'node:readline': false,
  'node:repl': false,
  'node:cluster': false,
  'node:worker_threads': false,
  'node:perf_hooks': false,
  'node:async_hooks': false,
  'node:inspector': false,
  'node:fs/promises': false,
  'node:path/posix': false,
  'node:path/win32': false,
  // Also block regular Node.js modules
  'stream': false,
  'fs': false,
  'path': false,
  'url': false,
  'http': false,
  'https': false,
  'zlib': false,
  'buffer': false,
  'util': false,
  'events': false,
  'querystring': false,
  'crypto': false,
  'os': false,
  'child_process': false,
  'process': false,
  'vm': false,
  'module': false,
  'assert': false,
  'constants': false,
  'domain': false,
  'punycode': false,
  'tty': false,
  'string_decoder': false,
  'timers': false,
  'tls': false,
  'net': false,
  'dgram': false,
  'dns': false,
  'readline': false,
  'repl': false,
  'cluster': false,
  'worker_threads': false,
  'perf_hooks': false,
  'async_hooks': false,
  'inspector': false,
};

// Add resolver configuration to exclude problematic packages
config.resolver.blockList = [
  /node_modules\/@react-email\/render\/dist\/node\/.*/,
  /node_modules\/.*\/node_modules\/@react-email\/.*/,
];

// Add resolver configuration to handle problematic packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config; 