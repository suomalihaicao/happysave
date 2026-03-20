#!/usr/bin/env node
import fs from 'fs';

// 按文件扫描隐式 any 的 map/filter/reduce/sort 回调并注入类型
const files = [
  'src/app/api/v1/ai/route.ts',
  'src/app/api/v1/cron/route.ts',
  'src/app/api/v1/growth/route.ts',
  'src/app/api/v1/marketing/route.ts',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 只处理简单的单参数箭头函数，避免误伤复杂表达式
    if (line.match(/\.(map|filter|reduce|sort)\s*\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\s*=>/)) {
      const newLine = line.replace(
        /\(([_a-zA-Z][_a-zA-Z0-9]*)\)\s*=>/g,
        '($1: any) =>',
      );
      if (newLine !== line) {
        lines[i] = newLine;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Fixed ${file}`);
  }
}

console.log('Done');
