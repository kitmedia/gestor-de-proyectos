const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function readProjects() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/projects') {
    const projects = readProjects();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(projects));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/projects') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const project = JSON.parse(body);
        const projects = readProjects();
        project.id = Date.now();
        projects.push(project);
        writeProjects(projects);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(project));
      } catch (e) {
        res.statusCode = 400;
        res.end('Invalid JSON');
      }
    });
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/projects/')) {
    const id = Number(url.pathname.split('/').pop());
    const projects = readProjects();
    const filtered = projects.filter(p => p.id !== id);
    writeProjects(filtered);
    res.statusCode = 204;
    res.end();
    return;
  }

  // serve static files
  let filePath = 'public' + url.pathname;
  if (filePath === 'public/') filePath = 'public/index.html';
  const ext = path.extname(filePath);
  const contentType = ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      res.setHeader('Content-Type', contentType);
      res.end(content);
    }
  });
}

const server = http.createServer(handleRequest);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
