#!/usr/bin/env python3
"""Gatya ローカルサーバー（URL エイリアス付き）"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT', '8878'))

ALIASES = {
    '/': '/index.html',
    '/show': '/cards-six.html',
    '/show/': '/cards-six.html',
    '/gatya': '/cards-six.html',
    '/gatya/': '/cards-six.html',
    '/cards-six': '/cards-six.html',
    '/cards-six/': '/cards-six.html',
    '/ref': '/reference-dual-viewer.html',
    '/ref/': '/reference-dual-viewer.html',
}


class GatyaHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path in ALIASES:
            qs = self.path.split('?', 1)
            self.path = ALIASES[path] + (f'?{qs[1]}' if len(qs) > 1 else '')
        return super().do_GET()

    def log_message(self, fmt, *args):
        print(fmt % args)


if __name__ == '__main__':
    os.chdir(ROOT)
    print(f'Gatya server: http://localhost:{PORT}/cards-six.html')
    print(f'  aliases: /show  /gatya  /cards-six  /ref')
    HTTPServer(('', PORT), GatyaHandler).serve_forever()
