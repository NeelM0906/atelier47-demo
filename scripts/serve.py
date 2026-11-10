"""Static server that gzips text responses, as Netlify, Vercel and GitHub Pages do. Usage: python3 scripts/serve.py [port]"""
import gzip, http.server, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEXT = ('.html', '.css', '.js', '.svg', '.json', '.xml', '.txt', '.webmanifest')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *a): pass
    def do_GET(self):
        path = Path(self.translate_path(self.path))
        if path.is_dir(): path = path / 'index.html'
        if not path.suffix in TEXT or 'gzip' not in self.headers.get('Accept-Encoding', '') or not path.is_file():
            return super().do_GET()
        body = gzip.compress(path.read_bytes(), 6)
        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8000), Handler).serve_forever()
