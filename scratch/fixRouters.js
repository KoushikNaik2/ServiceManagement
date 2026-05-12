const fs = require('fs');

const files = ['public/js/user-dashboard.jsx', 'public/js/admin-dashboard.jsx'];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove <Router> and </Router> tags
  content = content.replace(/<Router>/g, '');
  content = content.replace(/<\/Router>/g, '');
  
  // 2. Remove BrowserRouter import alias (keep Routes, Route etc)
  content = content.replace(
    'import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link }',
    'import { Routes, Route, useNavigate, useLocation, Link }'
  );
  
  // 3. Also remove ReactDOM import (not needed since App.jsx renders the root)
  // But keep it for now to avoid issues
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed: ' + filePath);
});

// Verify exports
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const exportMatch = c.match(/export default (\w+)/);
  const routerCount = (c.match(/<Router>/g) || []).length + (c.match(/<BrowserRouter/g) || []).length;
  console.log(f + ' -> exports: ' + (exportMatch ? exportMatch[1] : 'NONE') + ', nested Routers: ' + routerCount);
});
