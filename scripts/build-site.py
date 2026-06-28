#!/usr/bin/env python3
"""Copy minimal production assets into site/ for GitHub Pages."""
from __future__ import annotations

import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')

SRC_MODULES = [
    'gatya-unified.mjs',
    'countdown-three-overlay.mjs',
    'ink-three-overlay.mjs',
    'ink-procedural.mjs',
    'se.mjs',
    'ref-match-config.mjs',
    'card-bloom-composer.mjs',
    'rarity-config.mjs',
    'edge-glow-config.mjs',
]

MEDIA_ROOT = [
    're fire2.mp4',
    'ink test2.mp4',
    'white ssr.mp4',
    're fire se.mp3',
    '六角筒上昇.mp3',
    'ssr card登場.mp3',
    '和太鼓でドン.mp3',
    'LAST.mp3',
    'white ssr.mp3',
    'blue card.png',
    'silver card.png',
    'rainbow card.png',
    'gold card.png',
    'green card.png',
    'red card.png',
    'ssr card.png',
]

HTML_PAGES = [
    ('cards-six.html', 'index.html'),
]


def copy_file(src_rel: str, dst_rel: str) -> None:
    src = os.path.join(ROOT, src_rel)
    dst = os.path.join(SITE, dst_rel)
    if not os.path.isfile(src):
        raise FileNotFoundError(src_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    print(f'  {dst_rel}')


def copy_tree(src_rel: str, dst_rel: str) -> None:
    src = os.path.join(ROOT, src_rel)
    dst = os.path.join(SITE, dst_rel)
    if not os.path.isdir(src):
        raise FileNotFoundError(src_rel)
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(
        src,
        dst,
        ignore=shutil.ignore_patterns('.gitkeep', '.DS_Store'),
    )
    print(f'  {dst_rel}/')


def write_no_jekyll() -> None:
    path = os.path.join(SITE, '.nojekyll')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('')
    print('  .nojekyll')


def clean_site() -> None:
    if not os.path.isdir(SITE):
        os.makedirs(SITE)
        return
    for name in os.listdir(SITE):
        if name == 'README.md':
            continue
        path = os.path.join(SITE, name)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)


def build() -> None:
    print('Building site/ …')
    clean_site()

    print('HTML')
    for src_name, dst_name in HTML_PAGES:
        copy_file(src_name, dst_name)

    print('src/')
    for name in SRC_MODULES:
        copy_file(os.path.join('src', name), os.path.join('src', name))

    print('media')
    for name in MEDIA_ROOT:
        copy_file(name, name)

    print('assets/')
    copy_tree('assets/ink', 'assets/ink')
    copy_tree('assets/fonts', 'assets/fonts')

    write_no_jekyll()
    print(f'\nDone → {SITE}')
    print('Preview: python3 serve.py --site')


if __name__ == '__main__':
    try:
        build()
    except FileNotFoundError as err:
        print(f'build-site: missing file: {err}', file=sys.stderr)
        sys.exit(1)
