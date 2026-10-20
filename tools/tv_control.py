#!/usr/bin/env python3
"""Explicit-target official webOS CLI helpers. No target or private state defaults.
No operation is performed by --help. Commands capture CLI output and never print keys.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import uuid
import urllib.request
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
APP = "org.quiethome.launcher"
SERVICE = APP + ".service"


def cli(name, *arguments):
    executable = ROOT / "node_modules/.bin" / name
    if not executable.exists():
        found = shutil.which(name)
        if not found:
            raise RuntimeError("Install project CLI dependencies with npm ci")
        executable = Path(found)
    result = subprocess.run([str(executable), *arguments], capture_output=True, text=True, timeout=90)
    if result.returncode:
        raise RuntimeError("Official CLI operation failed; verify the explicit target and supported Developer Mode session")
    return result.stdout


def outside(raw):
    target = Path(raw).expanduser().resolve()
    if target == ROOT or ROOT in target.parents:
        raise ValueError("Private state must stay outside the repository")
    return target


def key_from_file(raw):
    target = outside(raw)
    if stat.S_IMODE(target.stat().st_mode) & 0o077:
        raise ValueError("Private key file must have mode 0600")
    content = json.loads(target.read_text())
    key = content.get("client_key")
    if not isinstance(key, str) or not re.fullmatch(r"[A-Za-z0-9-]{16,128}", key):
        raise ValueError("Expected a private approved-key JSON file from pair_tv.py")
    return key


def launch(device, parameters=None):
    arguments = ["--device", device, APP]
    if parameters is not None:
        arguments += ["--params", json.dumps(parameters, separators=(",", ":"))]
    cli("ares-launch", *arguments)


def own_evaluate(port, expression):
    from websockets.sync.client import connect
    with urllib.request.urlopen("http://127.0.0.1:" + str(port) + "/json/list", timeout=10) as response:
        targets = json.load(response)
    target = next((item for item in targets if item.get("url", "").endswith("/" + APP + "/index.html")), None)
    if not target:
        raise RuntimeError("Open this app with the official ares-inspect tool first")
    address = target.get("webSocketDebuggerUrl", "")
    parsed = urllib.parse.urlparse(address)
    if parsed.scheme != "ws" or parsed.hostname not in ["localhost", "127.0.0.1"]:
        raise RuntimeError("Unexpected inspector destination")
    with connect(address, open_timeout=10, max_size=1024*1024) as socket:
        socket.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expression, "awaitPromise": True, "returnByValue": True}}))
        while True:
            reply = json.loads(socket.recv(timeout=20))
            if reply.get("id") == 1:
                result = reply.get("result", {})
                if "exceptionDetails" in result or "error" in reply:
                    raise RuntimeError("Own-app inspection failed")
                return result.get("result", {}).get("value")


def stop(device, inspector_port):
    if not inspector_port:
        raise RuntimeError("For an existing app, launch it and run ares-inspect; pass its localhost --inspector-port")
    # Run in this app's existing official debugging context. The app calls its own
    # service; no system identity override, privileged role or foreign app is used.
    expression = "new Promise(function(resolve){var b=new PalmServiceBridge();b.onservicecallback=function(text){resolve(text)};b.call('luna://" + SERVICE + "/stop','{}');window.quietHomeStopBridge=b;})"
    value = json.loads(own_evaluate(inspector_port, expression))
    if isinstance(value, dict) and all(value.get(k) is True for k in ["returnValue", "persistedDisabled", "activityCanceled"]) and value.get("enabled") is False and value.get("anchor") is False:
        print("Own Home observer disabled and its persistent activity cancellation confirmed.")
        return
    raise RuntimeError("Own Home stop/cancel was not confirmed. Keep the app installed and use its Settings to stop it before retrying")


def export_preferences(port, raw):
    if not port:
        raise RuntimeError("Pass the existing official inspector's localhost --inspector-port")
    target = outside(raw)
    if target.exists():
        raise ValueError("Preference output exists; keep it or choose a new file")
    serialized = own_evaluate(port, "localStorage.getItem('launcher-config-v1')")
    data = json.loads(serialized) if serialized else {"appIds": [], "hiddenAppIds": [], "sourceIds": None, "useHomebrew": False, "wallpapers": True, "onlinePhotos": True}
    allowed = {"appIds", "hiddenAppIds", "sourceIds", "useHomebrew", "wallpapers", "onlinePhotos"}
    data = {key: value for key, value in data.items() if key in allowed}
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(data, stream, indent=2)
        stream.write("\n")
    os.chmod(target, 0o600)
    print("Only launcher preferences exported outside the repository; pairing state was excluded.")


def package_id(package):
    data = package.read_bytes()
    if data[:8] != b"!<arch>\n":
        raise ValueError("Expected an IPK archive")
    position = 8
    while position + 60 <= len(data):
        header = data[position:position+60]
        size = int(header[48:58].strip())
        name = header[:16].decode().strip().rstrip("/")
        body = data[position+60:position+60+size]
        position += 60 + size + size % 2
        if name.startswith("data.tar"):
            with tarfile.open(fileobj=io.BytesIO(body), mode="r:*") as archive:
                for member in archive.getmembers():
                    if member.name.endswith("/appinfo.json") and "/applications/" in member.name:
                        item = archive.extractfile(member)
                        return json.load(item).get("id")
    raise ValueError("No application metadata found in IPK")


def restore(device, raw, inspector_port):
    data = json.loads(outside(raw).read_text())
    if set(data) - {"appIds", "hiddenAppIds", "sourceIds", "useHomebrew", "wallpapers", "onlinePhotos"}:
        raise ValueError("Preference file contains unexpected fields; export only launcher-config-v1")
    if not all(isinstance(data.get(name), list) and all(isinstance(x, str) for x in data[name]) for name in ["appIds", "hiddenAppIds"]):
        raise ValueError("Preference file must contain appIds and hiddenAppIds arrays")
    source_ids = data.get("sourceIds")
    if source_ids is not None and not (isinstance(source_ids, list) and all(isinstance(x, str) for x in source_ids)):
        raise ValueError("Invalid sourceIds")
    data["useHomebrew"] = False
    for flag in ["wallpapers", "onlinePhotos"]:
        data[flag] = data.get(flag) is not False
    stop(device, inspector_port)
    cli("ares-launch", "--device", device, "--close", APP)
    launch(device, {"restoreConfig": data, "restoreNonce": str(uuid.uuid4())})
    print("Preference restoration requested. Verify order and Settings on the TV.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ["install", "launch", "provision", "stop", "remove", "restore-preferences", "export-preferences"]:
        command = sub.add_parser(name)
        command.add_argument("--device", required=True, help="Explicit existing official ares alias; example: TV")
        if name in ["install", "stop", "remove", "restore-preferences", "export-preferences"]:
            command.add_argument("--inspector-port", type=int, help="Existing ares-inspect localhost port; required for operations on an installed app")
        if name == "install":
            command.add_argument("--ipk", required=True, type=Path)
        if name == "provision":
            command.add_argument("--catalog-key-file", required=True)
            command.add_argument("--home-key-file", required=True)
        if name in ["restore-preferences", "export-preferences"]:
            command.add_argument("--file", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", args.device):
        parser.error("Use an explicit registered device alias")
    try:
        if args.command == "install":
            if package_id(args.ipk) != APP:
                raise ValueError("IPK identity does not match this generic export")
            installed = cli("ares-install", "--device", args.device, "--list")
            if re.search(r"(?m)^" + re.escape(APP) + r"(?:\s|$)", installed):
                stop(args.device, args.inspector_port)
            cli("ares-install", "--device", args.device, str(args.ipk.resolve()))
            print("Own package installed. Launch and verify its UI and service on the TV.")
        elif args.command == "launch":
            launch(args.device)
            print("Own app launch requested.")
        elif args.command == "provision":
            launch(args.device, {"catalogKey": key_from_file(args.catalog_key_file), "homeHelperKey": key_from_file(args.home_key_file), "homeProvisionNonce": str(uuid.uuid4())})
            print("Existing approved keys provisioned to the same app and its service. Verify live apps and Home in Settings.")
        elif args.command == "stop":
            stop(args.device, args.inspector_port)
        elif args.command == "remove":
            stop(args.device, args.inspector_port)
            cli("ares-install", "--device", args.device, "--remove", APP)
            remaining = cli("ares-install", "--device", args.device, "--list")
            if re.search(r"(?m)^" + re.escape(APP) + r"(?:\s|$)", remaining):
                raise RuntimeError("Own package removal was not confirmed")
            print("Own package removal confirmed. Check normal LG Home and retained TV settings.")
        elif args.command == "export-preferences":
            export_preferences(args.inspector_port, args.file)
        elif args.command == "restore-preferences":
            restore(args.device, args.file, args.inspector_port)
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print("Operation failed. Inspect the explicit target or input file without logging credentials.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
