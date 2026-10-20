#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
exec python3 tools/tv_control.py install "$@"
