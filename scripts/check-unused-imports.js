const fs = require('fs');
const path = require('path');

function checkUnusedImports(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...checkUnusedImports(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const importMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(s => s.trim().split(' ')[0]);
          const source = importMatch[2];
          for (const imp of imports) {
            if (imp && imp !== 'type') {
              const safeName = imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp('\\b' + safeName + '\\b', 'g');
              const matches = content.match(regex);
              if (!matches || matches.length <= 1) {
                results.push({ file: fullPath.replace(process.cwd() + '/', ''), import: imp, source });
              }
            }
          }
        }
      }
    }
  }
  return results;
}

const results = checkUnusedImports('src');
if (results.length === 0) {
  console.log('No unused imports found!');
} else {
  results.forEach(r => console.log(`${r.file}: "${r.import}" from ${r.source}`));
}
