#!/bin/bash

set -e

echo "Installing StarGit with Helm..."

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo "Helm is not installed. Please install Helm first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Set default values
NAMESPACE=${NAMESPACE:-stargit}
RELEASE_NAME=${RELEASE_NAME:-stargit}
VALUES_FILE=${VALUES_FILE:-values.yaml}

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Add required Helm repositories
echo "Adding Helm repositories..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install or upgrade StarGit
echo "Installing/upgrading StarGit..."
helm upgrade --install $RELEASE_NAME ./helm/stargit \
  --namespace $NAMESPACE \
  --values $VALUES_FILE \
  --wait \
  --timeout 10m

# Wait for all pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=$RELEASE_NAME -n $NAMESPACE --timeout=300s

# Get service information
echo "Getting service information..."
kubectl get services -n $NAMESPACE

echo "StarGit installation completed successfully!"
echo ""
echo "To access StarGit:"
echo "1. Frontend: kubectl port-forward svc/$RELEASE_NAME-frontend 3000:3000 -n $NAMESPACE"
echo "2. API: kubectl port-forward svc/$RELEASE_NAME-backend 3001:3001 -n $NAMESPACE"
echo "3. Git SSH: kubectl port-forward svc/$RELEASE_NAME-git-ssh 2222:22 -n $NAMESPACE"
echo ""
echo "Or configure ingress to access via domain name."
