#!/bin/bash

set -e

PROJECT_NAME="stargit"

echo "🚀 Creating $PROJECT_NAME project structure..."

mkdir -p $PROJECT_NAME/{packages/{server,cli},repos}
cd $PROJECT_NAME

echo "🧩 Initializing pnpm workspace..."
cat <<EOF > pnpm-workspace.yaml
packages:
  - "packages/*"
EOF

echo "📦 Creating root package.json..."
cat <<EOF > package.json
{
  "name": "$PROJECT_NAME",
  "private": true,
  "version": "0.1.0",
  "scripts": {},
  "workspaces": [
    "packages/*"
  ]
}
EOF

echo "📘 Creating root tsconfig.json..."
cat <<EOF > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": ["packages/**/*"]
}
EOF

###############################################
# Server Package
###############################################
cd packages/server
pnpm init -y

echo "🔧 Setting up server package.json..."
cat <<EOF > package.json
{
  "name": "@stargit/server",
  "version": "0.1.0",
  "main": "src/server.ts",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts"
  }
}
EOF

echo "📁 Creating server structure..."
mkdir -p src/routes src/services src/utils
cat <<EOF > src/server.ts
import Fastify from 'fastify'

const fastify = Fastify()

fastify.get('/', async (request, reply) => {
  return { hello: 'stargit' }
})

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err
  console.log('🚀 Stargit Server running on http://localhost:3000')
})
EOF

# Install server dependencies
pnpm add fastify tsx --filter @stargit/server
pnpm add -D typescript --filter @stargit/server

cd ../..

###############################################
# CLI Package
###############################################
cd packages/cli
pnpm init -y
pnpm add -D typescript

echo "🔧 Setting up CLI package.json..."
cat <<EOF > package.json
{
  "name": "@stargit/cli",
  "version": "0.1.0",
  "bin": {
    "stargit": "src/index.ts"
  },
  "type": "module"
}
EOF

echo "📁 Creating CLI entry..."
mkdir -p src
cat <<EOF > src/index.ts
console.log("🔧 Stargit CLI coming soon...")
EOF

cd ../..

###############################################
# Git & Root README
###############################################

# Initialize git and add .gitignore
if [ ! -d .git ]; then
  git init
fi

cat <<EOF > .gitignore
node_modules
dist
.env
.DS_Store
pnpm-lock.yaml
EOF

# Add root README
cat <<EOF > README.md
# stargit

A monorepo for the Stargit project, containing a Fastify server and CLI tool.

## Packages
- `@stargit/server`: Fastify server
- `@stargit/cli`: CLI tool

## Getting Started
See the instructions printed at the end of this script.
EOF

# Add README to server package
cat <<EOF > packages/server/README.md
# @stargit/server

A Fastify-based server for Stargit.

## Development
Run the development server:

```sh
pnpm --filter @stargit/server dev
```
EOF

# Add README to CLI package
cat <<EOF > packages/cli/README.md
# @stargit/cli

The CLI tool for Stargit (coming soon).
EOF

###############################################
# Done
###############################################

echo "📦 Installing dependencies..."
pnpm install -r

echo "✅ Stargit scaffold ready!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. pnpm install"
echo "3. pnpm --filter @stargit/server dev"
echo "4. Open http://localhost:3000 🚀"
