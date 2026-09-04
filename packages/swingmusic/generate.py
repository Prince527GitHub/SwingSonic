#!/usr/bin/env python3

"""
Generates packages/swingmusic.spec.json from swingmusic Python API.

Usage:
    python packages/generate-spec.py
    python packages/generate-spec.py --out packages/swingmusic.spec.json
    python packages/generate-spec.py --root ./swingmusic
"""

import argparse
import json
import pathlib
import re

FIELD_RE = re.compile(r'(\w+)\s*:\s*([^=]+?)(?:\s*=\s*Field\((.*)\))?\s*$')
CLASS_RE = re.compile(r'class\s+(\w+)\s*\([^)]*BaseModel[^)]*\):')
ROUTE_RE = re.compile(
    r'@api\.(get|post|put|delete|patch|route)\("([^"]*)"[^\n]*\n(?:[^\n]*\n)?def\s+(\w+)\s*\(([^)]*)\)',
    re.MULTILINE,
)
PARAM_RE = re.compile(r'(\w+)\s*:\s*(\w+)')
PREFIX_RE = re.compile(r'url_prefix="([^"]+)"')


def parse_models(text):
    """Extract {ModelName: {field: {type, required, description}}} from pydantic models."""
    models = {}
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        m = CLASS_RE.match(lines[i])
        if not m:
            i += 1
            continue
        name = m.group(1)
        fields = {}
        i += 1
        while i < len(lines) and (lines[i][:1] in (" ", "\t") or not lines[i].strip()):
            line = lines[i].strip()
            i += 1
            if not line or line.startswith(("#", '"""', "'''")) or line.startswith("class ") or line.startswith("@api"):
                if line.startswith("class ") or line.startswith("@api"):
                    break
                continue
            fm = FIELD_RE.match(line) if ":" in line else None
            if fm:
                fname, ftype, field_args = fm.group(1), fm.group(2).split("#")[0].strip(), fm.group(3) or ""
                desc_m = re.search(r'description="([^"]*)"', field_args)
                fields[fname] = {
                    "type": ftype,
                    "required": "Field(..." in line,
                    "description": desc_m.group(1) if desc_m else "",
                }
        models[name] = fields
    return models


def parse_routes(text, model_fields):
    """Extract route definitions from a blueprint file's source text."""
    routes = []
    for method, path, handler, params_str in ROUTE_RE.findall(text):
        inputs = {"path": None, "query": None, "body": None}
        for p in (p.strip() for p in params_str.split(",") if p.strip()):
            pm = PARAM_RE.match(p)
            if pm:
                pname, ptype = pm.groups()
                inputs[pname] = {"model": ptype, "fields": model_fields.get(ptype)}
        routes.append({
            "method": method.upper(),
            "path": path,
            "handler": handler,
            "inputs": inputs,
            "outputs": {"type": "json", "description": "JSON response"},
        })
    return routes


def generate(root: pathlib.Path):
    base = root / "src/swingmusic/api"
    getall_dir = base / "getall"

    model_fields = {}
    for f in [*base.glob("*.py"), *getall_dir.glob("*.py")]:
        model_fields.update(parse_models(f.read_text()))
    schemas = base / "apischemas.py"
    if schemas.exists():
        model_fields.update(parse_models(schemas.read_text()))

    spec = {}
    for f in base.glob("*.py"):
        text = f.read_text()
        routes = parse_routes(text, model_fields)
        if routes:
            pm = PREFIX_RE.search(text)
            spec[f.stem] = {"prefix": pm.group(1) if pm else f"/{f.stem}", "routes": routes}

    getall_routes = []
    getall_prefix = "/getall"
    for f in getall_dir.glob("*.py"):
        text = f.read_text()
        getall_routes.extend(parse_routes(text, model_fields))
        pm = PREFIX_RE.search(text)
        if pm:
            getall_prefix = pm.group(1)
    spec["getall"] = {"prefix": getall_prefix, "routes": getall_routes}

    return spec


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="./swingmusic")
    ap.add_argument("--out", default="packages/swingmusic.spec.json")
    args = ap.parse_args()

    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = pathlib.Path.cwd() / out

    spec = generate(pathlib.Path(args.root))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(spec, indent=2))
    print(f"wrote {out} ({len(spec)} blueprints)")
