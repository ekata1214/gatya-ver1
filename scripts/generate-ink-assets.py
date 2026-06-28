#!/usr/bin/env python3
"""
墨汁インク PNG（6ステップ × 3レイヤー）を生成し assets/ink/ に保存。

対応 API:
  - Google Gemini / Imagen（推奨）… GEMINI_API_KEY または GOOGLE_API_KEY
  - OpenAI Images … OPENAI_API_KEY（sk- で始まるキー）

使い方:
  export GEMINI_API_KEY="..."
  cd /path/to/gatya
  python3 scripts/generate-ink-assets.py

既存ファイルはスキップ（--force で上書き）。
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "ink"

DIGITS = ["5", "4", "3", "2", "1", "LAST"]

BASE_STYLE = (
    "Japanese sumi ink splatter on pure white background, vertical portrait 9:16, "
    "high contrast black ink only, no gray background, no text, no watermark, "
    "organic liquid splash photography style, isolated splatter elements"
)

LAYER_HINT = {
    "bg": (
        "background depth layer: many tiny droplets and faint small splatters spread across "
        "the full frame, soft and sparse, slightly out of focus feel"
    ),
    "mid": (
        "middle depth layer: medium ink puddles and radial splatter hubs, sharp edges, "
        "main body of the splash"
    ),
    "fg": (
        "foreground depth layer: large bold ink blobs near screen edges, heavy splatter "
        "with motion blur feel, closest to camera"
    ),
}

DIGIT_HINT = {
    "5": "composition biased toward lower-left, energetic wide spray entering from bottom-left",
    "4": "composition biased toward upper-right, diagonal spray from top-right corner",
    "3": "composition centered, symmetrical burst around middle of frame",
    "2": "composition biased toward lower-right, sweeping arc from bottom-right",
    "1": "composition minimal and upper-center, smaller restrained splash",
    "LAST": "composition maximum coverage, dramatic full-frame ink explosion, dense splatter",
}


def ssl_context() -> ssl.SSLContext:
    """macOS python.org ビルドの SSL エラー対策。"""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        ctx = ssl.create_default_context()
        return ctx


def http_json(method: str, url: str, headers: dict, body: dict | None = None, timeout: int = 180) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl_context()) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API error {e.code}: {detail}") from e


def resolve_api() -> tuple[str, str]:
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key.startswith("sk-"):
        return "openai", openai_key

    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY"):
        key = os.environ.get(name, "").strip()
        if key:
            return "google", key

    return "", ""


def generate_image_openai(api_key: str, prompt: str) -> bytes:
    payload = http_json(
        "POST",
        "https://api.openai.com/v1/images/generations",
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        {
            "model": "gpt-image-1",
            "prompt": prompt,
            "size": "1024x1536",
            "background": "opaque",
            "output_format": "png",
            "quality": "high",
        },
    )
    item = payload["data"][0]
    if "b64_json" in item:
        return base64.b64decode(item["b64_json"])
    if "url" in item:
        req = urllib.request.Request(item["url"])
        with urllib.request.urlopen(req, timeout=120, context=ssl_context()) as img_resp:
            return img_resp.read()
    raise RuntimeError(f"Unexpected OpenAI response: {payload}")


def _decode_google_image(payload: dict) -> bytes:
    if "predictions" in payload:
        pred = payload["predictions"][0]
        if "bytesBase64Encoded" in pred:
            return base64.b64decode(pred["bytesBase64Encoded"])
        if "mimeType" in pred and "bytesBase64Encoded" in pred:
            return base64.b64decode(pred["bytesBase64Encoded"])

    candidates = payload.get("candidates") or []
    for cand in candidates:
        parts = (cand.get("content") or {}).get("parts") or []
        for part in parts:
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])

    raise RuntimeError(f"No image in response: {json.dumps(payload)[:500]}")


def generate_image_google_imagen(api_key: str, prompt: str) -> bytes:
    models = (
        "imagen-4.0-fast-generate-001",
        "imagen-4.0-generate-001",
        "imagen-3.0-generate-002",
    )
    last_err: Exception | None = None
    for model in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict"
            payload = http_json(
                "POST",
                url,
                {
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                {
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": "9:16",
                    },
                },
            )
            return _decode_google_image(payload)
        except Exception as e:
            last_err = e
            continue
    raise RuntimeError(f"Imagen failed for all models: {last_err}")


def generate_image_google_gemini(api_key: str, prompt: str) -> bytes:
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent"
    payload = http_json(
        "POST",
        url,
        {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "imageConfig": {"aspectRatio": "9:16"},
            },
        },
    )
    return _decode_google_image(payload)


def generate_image_google(api_key: str, prompt: str) -> bytes:
    try:
        return generate_image_google_imagen(api_key, prompt)
    except Exception as imagen_err:
        print(f"  Imagen fallback → gemini-2.5-flash-image ({imagen_err})", file=sys.stderr)
        return generate_image_google_gemini(api_key, prompt)


def generate_image(provider: str, api_key: str, prompt: str) -> bytes:
    if provider == "openai":
        return generate_image_openai(api_key, prompt)
    return generate_image_google(api_key, prompt)


def build_prompt(digit: str, layer: str) -> str:
    return (
        f"{BASE_STYLE}. {LAYER_HINT[layer]}. {DIGIT_HINT[digit]}. "
        "Leave plenty of white space for multiply blend compositing."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ink PNG layers for Gatya countdown")
    parser.add_argument("--force", action="store_true", help="Overwrite existing PNGs")
    parser.add_argument("--only", help="Generate one digit only (e.g. 5 or LAST)")
    args = parser.parse_args()

    provider, api_key = resolve_api()
    if not api_key:
        print("ERROR: APIキーが未設定です。", file=sys.stderr)
        print('  export GEMINI_API_KEY="..."   # Google AI Studio（推奨）', file=sys.stderr)
        print('  export OPENAI_API_KEY="sk-..."  # OpenAI の場合', file=sys.stderr)
        return 1

    print(f"provider: {provider}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    digits = [args.only] if args.only else DIGITS
    if args.only and args.only not in DIGITS:
        print(f"ERROR: --only は {DIGITS} のいずれか", file=sys.stderr)
        return 1

    total = len(digits) * 3
    done = 0

    for digit in digits:
        for layer in ("bg", "mid", "fg"):
            out_path = OUT_DIR / f"{digit}-{layer}.png"
            if out_path.exists() and not args.force:
                print(f"skip  {out_path.relative_to(ROOT)}")
                done += 1
                continue

            prompt = build_prompt(digit, layer)
            print(f"[{done + 1}/{total}] generating {out_path.name} ...")
            png = generate_image(provider, api_key, prompt)
            out_path.write_bytes(png)
            print(f"saved {out_path.relative_to(ROOT)} ({len(png) // 1024} KB)")
            done += 1
            time.sleep(0.5)

    print(f"\nDone. {done} files in {OUT_DIR.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
