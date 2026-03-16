#!/usr/bin/env node
const fs = require('fs');

// Map of file -> line -> fix
const fixes = {
  'src/app/api/v1/ai/route.ts': {
    46: { old: 'stores.data.map((s) =>', new: 'stores.data.map((s: { name: string }) =>' },
    76: { old: 'stores.data) {', new: 'stores.data as import("@/types").Store[]) {' },
  },
  'src/app/api/v1/cron/route.ts': {
    37: { old: 'seoPages.data.map((p) => p.slug)', new: 'seoPages.data.map((p: { slug: string }) => p.slug)' },
    73: { old: 'coupons.data) {', new: 'coupons.data as import("@/types").Coupon[]) {' },
  },
};

// Actually, let me just read each file and fix by line context
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

    // Fix map/sort callbacks with implicit any
    // Pattern: .map((x) => or .sort((a, b) => or .filter((x) =>
    if (line.match(/\.\(map|sort|filter|reduce)\(\(([a-z])\)\s*(=>|,)/)) {
      // Add explicit : any type
      const newLine = line.replace(/\(([a-z])\)\s*(=>|,)/g, '($1: import("@/types").Store & Record<string, unknown>) $2');
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
