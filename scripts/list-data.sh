#!/bin/bash
set -e

# List files in Kubernetes deployment volume
# Usage: ./scripts/list-data.sh [options] [namespace] [deployment] [container] [remote-path]
#
# Options:
#   -l, --long     Show detailed listing (size, date)
#   -s, --summary  Show only summary (count, total size)
#   -h, --help     Show this help

show_help() {
    head -10 "$0" | tail -8 | sed 's/^# //'
    exit 0
}

LONG=false
SUMMARY=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -l|--long) LONG=true; shift ;;
        -s|--summary) SUMMARY=true; shift ;;
        -h|--help) show_help ;;
        *) break ;;
    esac
done

NAMESPACE="${1:-wdsx}"
DEPLOYMENT="${2:-wdsx}"
CONTAINER="${3:-wdsx}"
REMOTE_PATH="${4:-/data}"

# Get pod name
POD=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [[ -z "$POD" ]]; then
    echo "❌ Error: No running pod found for deployment '$DEPLOYMENT' in namespace '$NAMESPACE'" >&2
    exit 1
fi

if [[ "$SUMMARY" == true ]]; then
    # Summary only
    COUNT=$(kubectl exec -n "$NAMESPACE" "$POD" -c "$CONTAINER" -- find "$REMOTE_PATH" -type f 2>/dev/null | wc -l)
    SIZE=$(kubectl exec -n "$NAMESPACE" "$POD" -c "$CONTAINER" -- du -sh "$REMOTE_PATH" 2>/dev/null | cut -f1)
    echo "📁 $REMOTE_PATH: $COUNT files, $SIZE total"
elif [[ "$LONG" == true ]]; then
    # Detailed listing
    kubectl exec -n "$NAMESPACE" "$POD" -c "$CONTAINER" -- find "$REMOTE_PATH" -type f -exec ls -lh {} \; 2>/dev/null
else
    # Simple file list
    kubectl exec -n "$NAMESPACE" "$POD" -c "$CONTAINER" -- find "$REMOTE_PATH" -type f 2>/dev/null
fi
