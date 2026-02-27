#!/usr/bin/env node
/**
 * Claude Code Hook → Football Bridge
 *
 * Reads hook JSON from stdin, truncates large payloads,
 * POSTs to the football server. Silently ignores if server is down.
 */
const http = require('http');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
    if (!input.trim()) { process.exit(0); }

    // Truncate tool_response to avoid sending megabytes
    try {
        const data = JSON.parse(input);
        if (data.tool_response) {
            const raw = typeof data.tool_response === 'string'
                ? data.tool_response
                : JSON.stringify(data.tool_response);
            if (raw.length > 1000) {
                if (typeof data.tool_response === 'string') {
                    data.tool_response = data.tool_response.substring(0, 300) + '...[truncated]';
                } else {
                    const { exitCode, error } = data.tool_response;
                    const stderr = data.tool_response.stderr
                        ? data.tool_response.stderr.substring(0, 300) : undefined;
                    data.tool_response = { exitCode, error, stderr };
                }
            }
        }
        input = JSON.stringify(data);
    } catch (e) { /* forward as-is */ }

    const req = http.request({
        hostname: '127.0.0.1',
        port: 3333,
        path: '/event',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 2000,
    }, (res) => {
        res.resume();
        process.exit(0);
    });

    req.on('error', () => process.exit(0));
    req.on('timeout', () => { req.destroy(); process.exit(0); });
    req.write(input);
    req.end();
});
