#!/bin/bash
set -e

# Upload WDS data to Kubernetes PVC
# Usage: ./scripts/upload-data.sh <data-path> [namespace]

DATA_PATH="${1:-.data}"
NAMESPACE="${2:-wdsx}"
POD_NAME="wdsx-upload"
PVC_NAME="wdsx-data"

if [[ ! -d "$DATA_PATH" ]]; then
    echo "Error: Data directory '$DATA_PATH' not found"
    echo "Usage: $0 <data-path> [namespace]"
    exit 1
fi

echo "📦 Uploading WDS data from '$DATA_PATH' to namespace '$NAMESPACE'"

# Check if upload pod already exists
if kubectl get pod -n "$NAMESPACE" "$POD_NAME" &>/dev/null; then
    echo "⚠️  Upload pod already exists, deleting..."
    kubectl delete pod -n "$NAMESPACE" "$POD_NAME" --wait=true
fi

# Create upload pod
echo "🚀 Creating upload pod..."
kubectl apply -n "$NAMESPACE" -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $POD_NAME
  labels:
    app: wdsx-upload
spec:
  containers:
  - name: upload
    image: alpine
    command: ["sleep", "3600"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: $PVC_NAME
  restartPolicy: Never
EOF

# Wait for pod to be ready
echo "⏳ Waiting for upload pod to be ready..."
kubectl wait --for=condition=Ready pod/"$POD_NAME" -n "$NAMESPACE" --timeout=120s

# Copy data
echo "📤 Copying data (this may take a while)..."
kubectl cp "$DATA_PATH/." "$NAMESPACE/$POD_NAME:/data/"

# Verify
echo "✅ Verifying upload..."
FILE_COUNT=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- find /data -type f | wc -l)
echo "   Found $FILE_COUNT files in /data"

# Cleanup
echo "🧹 Cleaning up upload pod..."
kubectl delete pod -n "$NAMESPACE" "$POD_NAME" --wait=false

echo ""
echo "✨ Done! Data uploaded successfully."
echo "   Restart the wdsx deployment to pick up new data:"
echo "   kubectl rollout restart deployment/wdsx -n $NAMESPACE"
