import { spawn } from 'node:child_process';

function run(cmd, args, opts = {}) {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    p.on('exit', (code) => {
        if (code !== 0) process.exit(code || 1);
    });
    return p;
}

run('npx', ['tsc', '--watch']);
run('node', ['server.mjs']);
