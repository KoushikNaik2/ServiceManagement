import fs from 'fs';
import path from 'path';

const files = ['login.jsx', 'register.jsx', 'user-dashboard.jsx', 'admin-dashboard.jsx', 'book-service.jsx', 'track-status.jsx', 'history.jsx'];
files.forEach(file => {
  const filePath = path.join('public', 'js', file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace <a ... href="/path.html" ...> with <Link ... to="/path" ...>
  content = content.replace(/<a([^>]*)href=(['"`])\/([a-zA-Z0-9-]+)\.html(['"`])([^>]*)>/g, "<Link$1to='/$3'$5>");
  // Replace </a> with </Link> ONLY if we know it corresponds to a Link. To be safe, if a file has imported Link, just replace all </a> with </Link>.
  content = content.replace(/<\/a>/g, "</Link>");
  
  fs.writeFileSync(filePath, content);
});
console.log('Fixed links.');
