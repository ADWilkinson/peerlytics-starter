#!/bin/bash

set -euo pipefail

DEPLOY_ENDPOINT="https://codex-deploy-skills.vercel.sh/api/deploy"

detect_framework() {
    local pkg_json="$1"

    if [ ! -f "$pkg_json" ]; then
        echo "null"
        return
    fi

    local content
    content=$(cat "$pkg_json")

    has_dep_exact() {
        echo "$content" | grep -q "\"$1\""
    }

    has_dep_prefix() {
        echo "$content" | grep -q "\"$1"
    }

    if has_dep_exact "blitz"; then echo "blitzjs"; return; fi
    if has_dep_exact "next"; then echo "nextjs"; return; fi
    if has_dep_exact "gatsby"; then echo "gatsby"; return; fi
    if has_dep_prefix "@remix-run/"; then echo "remix"; return; fi
    if has_dep_prefix "@react-router/"; then echo "react-router"; return; fi
    if has_dep_exact "@tanstack/start"; then echo "tanstack-start"; return; fi
    if has_dep_exact "astro"; then echo "astro"; return; fi
    if has_dep_exact "@shopify/hydrogen"; then echo "hydrogen"; return; fi
    if has_dep_exact "@sveltejs/kit"; then echo "sveltekit-1"; return; fi
    if has_dep_exact "svelte"; then echo "svelte"; return; fi
    if has_dep_exact "nuxt"; then echo "nuxtjs"; return; fi
    if has_dep_exact "vitepress"; then echo "vitepress"; return; fi
    if has_dep_exact "vuepress"; then echo "vuepress"; return; fi
    if has_dep_exact "gridsome"; then echo "gridsome"; return; fi
    if has_dep_exact "@solidjs/start"; then echo "solidstart-1"; return; fi
    if has_dep_exact "@docusaurus/core"; then echo "docusaurus-2"; return; fi
    if has_dep_prefix "@redwoodjs/"; then echo "redwoodjs"; return; fi
    if has_dep_exact "hexo"; then echo "hexo"; return; fi
    if has_dep_exact "@11ty/eleventy"; then echo "eleventy"; return; fi
    if has_dep_exact "@ionic/angular"; then echo "ionic-angular"; return; fi
    if has_dep_exact "@angular/core"; then echo "angular"; return; fi
    if has_dep_exact "@ionic/react"; then echo "ionic-react"; return; fi
    if has_dep_exact "react-scripts"; then echo "create-react-app"; return; fi
    if has_dep_exact "ember-cli" || has_dep_exact "ember-source"; then echo "ember"; return; fi
    if has_dep_exact "@dojo/framework"; then echo "dojo"; return; fi
    if has_dep_prefix "@polymer/"; then echo "polymer"; return; fi
    if has_dep_exact "preact"; then echo "preact"; return; fi
    if has_dep_exact "@stencil/core"; then echo "stencil"; return; fi
    if has_dep_exact "umi"; then echo "umijs"; return; fi
    if has_dep_exact "sapper"; then echo "sapper"; return; fi
    if has_dep_exact "saber"; then echo "saber"; return; fi
    if has_dep_exact "sanity"; then echo "sanity-v3"; return; fi
    if has_dep_prefix "@sanity/"; then echo "sanity"; return; fi
    if has_dep_prefix "@storybook/"; then echo "storybook"; return; fi
    if has_dep_exact "@nestjs/core"; then echo "nestjs"; return; fi
    if has_dep_exact "elysia"; then echo "elysia"; return; fi
    if has_dep_exact "hono"; then echo "hono"; return; fi
    if has_dep_exact "fastify"; then echo "fastify"; return; fi
    if has_dep_exact "h3"; then echo "h3"; return; fi
    if has_dep_exact "nitropack"; then echo "nitro"; return; fi
    if has_dep_exact "express"; then echo "express"; return; fi
    if has_dep_exact "vite"; then echo "vite"; return; fi
    if has_dep_exact "parcel"; then echo "parcel"; return; fi

    echo "null"
}

INPUT_PATH="${1:-.}"
TEMP_DIR=$(mktemp -d)
TARBALL="$TEMP_DIR/project.tgz"
STAGING_DIR="$TEMP_DIR/staging"
CLEANUP_TEMP=true

cleanup() {
    if [ "$CLEANUP_TEMP" = true ]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

echo "Preparing deployment..." >&2

FRAMEWORK="null"

if [ -f "$INPUT_PATH" ] && [[ "$INPUT_PATH" == *.tgz ]]; then
    echo "Using provided tarball..." >&2
    TARBALL="$INPUT_PATH"
    CLEANUP_TEMP=false
elif [ -d "$INPUT_PATH" ]; then
    PROJECT_PATH=$(cd "$INPUT_PATH" && pwd)
    FRAMEWORK=$(detect_framework "$PROJECT_PATH/package.json")

    mkdir -p "$STAGING_DIR"
    echo "Staging project files..." >&2
    tar -C "$PROJECT_PATH" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.env' \
        --exclude='.env.*' \
        -cf - . | tar -C "$STAGING_DIR" -xf -

    if [ ! -f "$PROJECT_PATH/package.json" ]; then
        HTML_FILES=$(find "$STAGING_DIR" -maxdepth 1 -name "*.html" -type f)
        HTML_COUNT=$(printf '%s\n' "$HTML_FILES" | sed '/^$/d' | wc -l | tr -d '[:space:]')

        if [ "$HTML_COUNT" -eq 1 ]; then
            HTML_FILE=$(echo "$HTML_FILES" | head -1)
            BASENAME=$(basename "$HTML_FILE")

            if [ "$BASENAME" != "index.html" ]; then
                echo "Renaming $BASENAME to index.html..." >&2
                mv "$HTML_FILE" "$STAGING_DIR/index.html"
            fi
        fi
    fi

    echo "Creating deployment package..." >&2
    tar -czf "$TARBALL" -C "$STAGING_DIR" .
else
    echo "Error: Input must be a directory or a .tgz file" >&2
    exit 1
fi

if [ "$FRAMEWORK" != "null" ]; then
    echo "Detected framework: $FRAMEWORK" >&2
fi

echo "Deploying..." >&2
RESPONSE=$(curl -s -X POST "$DEPLOY_ENDPOINT" -F "file=@$TARBALL" -F "framework=$FRAMEWORK")

echo "Your deployment is building." >&2

if echo "$RESPONSE" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "Error: $ERROR_MSG" >&2
    exit 1
fi

PREVIEW_URL=$(echo "$RESPONSE" | grep -o '"previewUrl":"[^"]*"' | cut -d'"' -f4)
CLAIM_URL=$(echo "$RESPONSE" | grep -o '"claimUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PREVIEW_URL" ]; then
    echo "Error: Could not extract preview URL from response" >&2
    echo "$RESPONSE" >&2
    exit 1
fi

echo "" >&2
echo "Deployment successful!" >&2
echo "" >&2
echo "Preview URL: $PREVIEW_URL" >&2
echo "Claim URL:   $CLAIM_URL" >&2
echo "" >&2

echo "$RESPONSE"
