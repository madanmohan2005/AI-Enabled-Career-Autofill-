const fs = require('fs');
const path = require('path');

// Read test-form.html and dist/content/content.js
const html = fs.readFileSync(path.join(__dirname, 'test-form.html'), 'utf-8');

console.log('Testing test-form.html content length:', html.length);
// Check elements
const inputMatches = html.match(/<(input|select|textarea)[^>]*>/g) || [];
console.log('Found form controls in test-form.html:', inputMatches.length);
inputMatches.forEach((tag, i) => {
  console.log(`[${i + 1}] ${tag}`);
});
