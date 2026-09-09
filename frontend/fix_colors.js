const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(var(--rgb-white),');
  content = content.replace(/color:\s*'white'/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*'#fff'/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*'#ffffff'/gi, 'color: "var(--text-primary)"');
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
  }
});
console.log('Modified files:', changedFiles);
