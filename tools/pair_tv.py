#!/usr/bin/env python3
"""Normal TV-approved SSAP pairing, with explicit certificate pinning.
All runtime keys are written outside this checkout with restrictive permissions.
"""
import argparse
import asyncio
import copy
import hashlib
import json
import os
from pathlib import Path
import ssl
import sys
from generate_registration import registration_payload

ROOT = Path(__file__).resolve().parents[1]


def private_target(raw):
    target = Path(raw).expanduser().resolve()
    if target == ROOT or ROOT in target.parents:
        raise ValueError("Choose a key file outside the repository")
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if target.exists():
        raise ValueError("Key file already exists; keep it or choose a new filename")
    return target


async def pair(args):
    from websockets.asyncio.client import connect
    target = private_target(args.key_file)
    expected = args.fingerprint.lower().replace(":", "")
    if len(expected) != 64 or any(c not in "0123456789abcdef" for c in expected):
        raise ValueError("Provide the independently checked SHA-256 server-certificate fingerprint")
    # The TV uses a self-signed certificate. Do not send registration or a key
    # until its exact certificate fingerprint has matched the explicit pin.
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    host = "[" + args.host + "]" if ":" in args.host and not args.host.startswith("[") else args.host
    async with connect("wss://" + host + ":3001", ssl=context, open_timeout=10, max_size=1024*1024) as socket:
        certificate = socket.transport.get_extra_info("ssl_object").getpeercert(binary_form=True)
        if hashlib.sha256(certificate).hexdigest() != expected:
            raise ValueError("TV certificate does not match the explicit pin; nothing was registered")
        payload = ({"pairingType": "PROMPT", "forcePairing": False, "manifest": {"manifestVersion": 1, "appVersion": "1.0", "permissions": ["READ_INSTALLED_APPS"]}} if args.scope == "catalog" else copy.deepcopy(registration_payload()))
        await socket.send(json.dumps({"type": "register", "id": "pair", "payload": payload}))
        print("Approve this connection on the TV. No approval is automated.")
        while True:
            message = json.loads(await asyncio.wait_for(socket.recv(), timeout=90))
            if message.get("type") == "error":
                raise RuntimeError("TV declined pairing; no key was saved")
            if message.get("type") == "registered":
                key = message.get("payload", {}).get("client-key")
                if not isinstance(key, str) or not key:
                    raise RuntimeError("TV returned no client key")
                descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(descriptor, "w") as stream:
                    json.dump({"client_key": key}, stream)
                    stream.write("\n")
                os.chmod(target, 0o600)
                print("Approved key saved outside the repository with mode 0600; key contents are not printed.")
                return


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True, help="TV address; documentation example: 192.0.2.10")
    parser.add_argument("--fingerprint", required=True, help="Independently checked server-certificate SHA-256 pin")
    parser.add_argument("--scope", choices=["catalog", "home"], default="home", help="Separate catalog-only or Home-observer consent")
    parser.add_argument("--key-file", required=True, help="New private output file outside this repository")
    args = parser.parse_args()
    try:
        asyncio.run(pair(args))
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print("Pairing failed. Check the TV, its certificate pin, network and normal consent prompt. No credential details were logged.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
