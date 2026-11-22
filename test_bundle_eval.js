const fs = require('fs');

// Download latest bundle
const code = fs.readFileSync('/tmp/bundle_latest.js', 'utf8');

// Check for syntax or reference errors
const { JSDOM } = require('jsdom');
