#!/bin/bash

set -e

# Deployment script for StarGit platform

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "Deploying StarGit to $ENVIRONMENT environment..."

# Build and tag Docker images
echo "Building Docker images..."
docker build -f Dockerfile.frontend -t stargit/frontend:$VERSION .
docker build -f Dockerfile.backend -t stargit/backend:$VERSION .

# Push to registry
echo "Pushing images to registry..."
docker push stargit/frontend:$VERSION
docker push stargit/backend:$VERSION

# Deploy to Kubernetes
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/postgres.yaml
    kubectl apply -f k8s/redis.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/backend.yaml
    
    # Wait for rollout
    kubectl rollout status deployment/frontend -n stargit
    kubectl rollout status deployment/backend -n stargit
    
    echo "Production deployment complete!"
else
    echo "Deploying to staging..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    echo "Staging deployment complete!"
fi

# Run database migrations
echo "Running database migrations..."
kubectl exec -it deployment/backend -n stargit -- npm run migrate

echo "Deployment completed successfully!"
