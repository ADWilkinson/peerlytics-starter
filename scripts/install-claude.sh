#!/bin/bash
set -e

SKILLS_DIR="${HOME}/.claude/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/../skills/claude"

for skill_dir in "${SRC_DIR}"/*/; do
  skill_name=$(basename "$skill_dir")
  target="${SKILLS_DIR}/${skill_name}"

  mkdir -p "$target"
  cp -r "${skill_dir}"* "$target/"
  echo "Installed: ${skill_name}"
done

echo "Done. Restart Claude Code to activate skills."
