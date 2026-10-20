#!/usr/bin/env python3
"""Generate public SDK registration data from the pinned installed distribution.
No user key or private configuration is read. The generated file is git-ignored.
"""
import ast
import importlib.metadata
import json
from pathlib import Path


def registration_payload():
    distribution = importlib.metadata.distribution("aiowebostv")
    if distribution.version != "0.4.2":
        raise RuntimeError("Install the pinned aiowebostv==0.4.2 distribution")
    source = Path(distribution.locate_file("aiowebostv/handshake.py")).read_text()
    constants = {}
    class PublicConstantResolver(ast.NodeTransformer):
        def visit_Name(self, node):
            if node.id not in constants:
                raise RuntimeError("Unexpected reference in public SDK data")
            return ast.parse(repr(constants[node.id]), mode="eval").body
    for node in ast.parse(source).body:
        if not isinstance(node, ast.Assign):
            continue
        names = [target.id for target in node.targets if isinstance(target, ast.Name)]
        if not any(name in ["SIGNATURE", "REGISTRATION_PAYLOAD"] for name in names):
            continue
        value = ast.literal_eval(PublicConstantResolver().visit(node.value))
        for name in names:
            constants[name] = value
        if "REGISTRATION_PAYLOAD" in names:
            if not isinstance(value, dict) or "client-key" in value:
                raise RuntimeError("Unexpected SDK registration data")
            return value
    raise RuntimeError("Public REGISTRATION_PAYLOAD was not found")


def main():
    target = Path(__file__).resolve().parents[1] / "Service/sdk-registration.json"
    target.write_text(json.dumps(registration_payload(), indent=2) + "\n")
    print("Generated public SDK registration data; no client key included.")


if __name__ == "__main__":
    main()
