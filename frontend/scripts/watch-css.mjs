// scripts/watch-css.mjs
import { watch } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('..', import.meta.url));
const srcFile = join(__dirname, 'style.css');
const destFile = join(__dirname, 'dist', 'style.css');

async function copyCSS() {
    try {
        await mkdir(dirname(destFile), { recursive: true });
        await copyFile(srcFile, destFile);
        // console.log('✅ CSS copied to dist/');
    } catch (err) {
        // console.error('❌ Error copying CSS:', err.message);
    }
}

// Initial copy
// console.log('👀 Watching style.css for changes...');
await copyCSS();

// Watch for changes
watch(srcFile, async (eventType) => {
    if (eventType === 'change') {
        // console.log('🔄 CSS changed, copying...');
        await copyCSS();
    }
});
