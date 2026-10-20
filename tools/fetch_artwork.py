#!/usr/bin/env python3
"""Fetch original provider artwork separately from MIT code; no image editing."""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def render_hash(data):
    # Apple can regenerate EXIF/XMP IDs without changing any image/color bytes.
    # Hash every other original PNG chunk; save the downloaded bytes untouched.
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("Expected an original PNG")
    position = 8
    chunks = []
    while position + 12 <= len(data):
        size = int.from_bytes(data[position:position+4], "big")
        tag = data[position+4:position+8]
        chunk = data[position:position+size+12]
        if len(chunk) != size + 12:
            raise RuntimeError("Truncated PNG")
        position += size + 12
        if tag not in [b"eXIf", b"iTXt", b"tEXt", b"zTXt", b"tIME"]:
            chunks.append(chunk)
    return hashlib.sha256(b"".join(chunks)).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list", action="store_true", help="List public sources without downloads")
    args = parser.parse_args()
    rows = json.loads((ROOT / "public/licenses/App_Artwork_Sources.json").read_text())
    if args.list:
        for row in rows:
            print(row["title"] + ": " + row["source_url"])
        return
    mapping = {}
    for row in rows:
        parsed = urllib.parse.urlparse(row["url"])
        if parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.endswith(".mzstatic.com"):
            raise RuntimeError("Artwork URL is outside Apple's public HTTPS CDN")
        filename = row["id"] + ".png"
        if "/" in filename or "\\" in filename or ".." in filename:
            raise RuntimeError("Invalid app ID")
        target = ROOT / "public/icons/apps" / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == row["sha256"]:
            mapping[row["id"]] = filename
            continue
        with urllib.request.urlopen(row["url"], timeout=30) as response:
            data = response.read(8_000_001)
        if len(data) > 8_000_000 or render_hash(data) != row["render_sha256"]:
            raise RuntimeError("Artwork changed; review provenance before updating the manifest: " + row["title"])
        if not data.startswith(b"\x89PNG\r\n\x1a\n"):
            raise RuntimeError("Expected an original PNG")
        target.write_bytes(data)
        mapping[row["id"]] = filename
    generated = "// Generated from reviewed public artwork sources. Not covered by MIT.\nexport const ARTWORK:Record<string,string>=" + json.dumps(mapping, indent=2) + ";\n"
    (ROOT / "src/config/artwork.generated.ts").write_text(generated)
    print("Fetched and rendering-chunk-hash-verified " + str(len(mapping)) + " original provider icons. Keep these generated files private unless you have distribution rights.")


if __name__ == "__main__":
    main()
