#!/bin/bash
set -e

# Download data from Kubernetes deployment to local directory
# Usage: ./scripts/download-data.sh <local-path> [namespace] [deployment] [container] [remote-path]

LOCAL_PATH="${1:-.data}"
NAMESPACE="${2:-wdsx}"
DEPLOYMENT="${3:-wdsx}"
CONTAINER="${4:-wdsx}"
REMOTE_PATH="${5:-/data}"

echo "📥 Downloading from $DEPLOYMENT/$CONTAINER:$REMOTE_PATH to '$LOCAL_PATH'"

# Create local directory if needed
mkdir -p "$LOCAL_PATH"

# Get pod name
POD=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [[ -z "$POD" ]]; then
    echo "❌ Error: No running pod found for deployment '$DEPLOYMENT' in namespace '$NAMESPACE'"
    exit 1
fi

echo "📦 Found pod: $POD"

# Check if container has tar
HAS_TAR=$(kubectl exec -n "$NAMESPACE" "$POD" -c "$CONTAINER" -- which tar 2>/dev/null || echo "")

if [[ -n "$HAS_TAR" ]]; then
    # Direct kubectl cp (requires tar in container)
    echo "📤 Copying via kubectl cp..."
    kubectl cp "$NAMESPACE/$POD:$REMOTE_PATH/." "$LOCAL_PATH/" -c "$CONTAINER"
else
    echo "⚠️  Container doesn't have tar, using temporary pod..."
    
    # Get PVC name from deployment
    PVC=$(kubectl get deployment -n "$NAMESPACE" "$DEPLOYMENT" -o jsonpath='{.spec.template.spec.volumes[?(@.persistentVolumeClaim)].persistentVolumeClaim.claimName}' 2>/dev/null)
    
    if [[ -z "$PVC" ]]; then
        echo "❌ Error: Could not find PVC for deployment '$DEPLOYMENT'"
        exit 1
    fi
    
    HELPER_POD="$DEPLOYMENT-download"
    
    # Cleanup any existing helper pod
    kubectl delete pod -n "$NAMESPACE" "$HELPER_POD" --ignore-not-found=true --wait=true 2>/dev/null
    
    # Create helper pod with tar
    echo "🚀 Creating helper pod with PVC '$PVC'..."
    kubectl apply -n "$NAMESPACE" -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $HELPER_POD
  labels:
    app: $HELPER_POD
spec:
  containers:
  - name: helper
    image: alpine
    command: ["sleep", "3600"]
    volumeMounts:
    - name: data
      mountPath: /data
      readOnly: true
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: $PVC
  restartPolicy: Never
EOF
    
    # Wait for helper pod
    echo "⏳ Waiting for helper pod..."
    kubectl wait --for=condition=Ready pod/"$HELPER_POD" -n "$NAMESPACE" --timeout=120s
    
    # Copy data
    echo "📤 Copying data..."
    kubectl cp "$NAMESPACE/$HELPER_POD:/data/." "$LOCAL_PATH/" -c helper
    
    # Cleanup
    echo "🧹 Cleaning up helper pod..."
    kubectl delete pod -n "$NAMESPACE" "$HELPER_POD" --wait=false
fi

# Count files
FILE_COUNT=$(find "$LOCAL_PATH" -type f | wc -l | tr -d ' ')
echo ""
echo "✨ Done! Downloaded $FILE_COUNT files to '$LOCAL_PATH'"
