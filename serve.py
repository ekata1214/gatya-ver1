#!/usr/bin/env python3
"""Gatya ローカルサーバー（URL エイリアス付き）"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import argparse
import os

DEFAULT_ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT', '8878'))

ALIASES = {
    '/': '/index.html',
    '/show': '/index.html',
    '/show/': '/index.html',
    '/gatya': '/index.html',
    '/gatya/': '/index.html',
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


def main():
    parser = argparse.ArgumentParser(description='Gatya local static server')
    parser.add_argument(
        '--site',
        action='store_true',
        help='serve site/ (production bundle). Run scripts/build-site.py first.',
    )
    args = parser.parse_args()

    root = os.path.join(DEFAULT_ROOT, 'site') if args.site else DEFAULT_ROOT
    if args.site and not os.path.isfile(os.path.join(root, 'index.html')):
        print('site/ is empty. Run: python3 scripts/build-site.py')
        raise SystemExit(1)

    os.chdir(root)
    label = 'site/' if args.site else 'repo root'
    print(f'Gatya server ({label}): http://localhost:{PORT}/')
    if args.site:
        print('  production bundle (index.html)')
    else:
        print('  aliases: /show  /gatya  /cards-six  /ref')
    HTTPServer(('', PORT), GatyaHandler).serve_forever()


if __name__ == '__main__':
    main()
