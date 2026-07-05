const fs = require('fs');
const code = fs.readFileSync('node_modules/@ai-sdk/provider-utils/dist/index.d.ts', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('type BaseTool<'));
if (start !== -1) {
  console.log(lines.slice(start - 2, start + 50).join('\n'));
} else {
  console.log("NOT FOUND");
}
