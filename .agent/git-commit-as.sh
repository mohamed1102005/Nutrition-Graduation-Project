#!/usr/bin/env bash
# Linux/macOS counterpart of git-commit-as.ps1.
# Commits the staged changes as the given agent, then restores the owner's git config.
#
# Usage: .agent/git-commit-as.sh <agent> "<message>" [--push]
#   agent: mohamed-mahmoud | mohamed-ashraf | omar-mohamed | omar-khaled | ali-raslan

set -euo pipefail

ORIGINAL_USER="ZiadMD"
ORIGINAL_EMAIL="ziadmohamedgamal25@gmail.com"

usage() {
  echo "Usage: $0 <mohamed-mahmoud|mohamed-ashraf|omar-mohamed|omar-khaled|ali-raslan> \"<message>\" [--push]" >&2
  exit 1
}

[[ $# -lt 2 ]] && usage

AGENT="$1"
MESSAGE="$2"
PUSH=false
if [[ $# -ge 3 ]]; then
  [[ "$3" == "--push" ]] || usage
  PUSH=true
fi

case "$AGENT" in
  mohamed-mahmoud) NAME="mohamed1102005";       EMAIL="m7md1102005@gmail.com" ;;
  mohamed-ashraf)  NAME="mohamedashraff8";      EMAIL="mohamedashraff8@users.noreply.github.com" ;;
  omar-mohamed)    NAME="om429810-gif";         EMAIL="om429810-gif@users.noreply.github.com" ;;
  omar-khaled)     NAME="omarkhaledd22222-del"; EMAIL="omarkhaledd22222-del@users.noreply.github.com" ;;
  ali-raslan)      NAME="aliraslan";            EMAIL="aliraslan@users.noreply.github.com" ;;
  *) echo "Unknown agent: $AGENT" >&2; usage ;;
esac

restore() {
  echo "Restoring original Git config: $ORIGINAL_USER <$ORIGINAL_EMAIL>..."
  git config user.name "$ORIGINAL_USER"
  git config user.email "$ORIGINAL_EMAIL"
  echo "Git config restored successfully."
}
trap restore EXIT

echo "Configuring Git author as $NAME <$EMAIL>..."
git config user.name "$NAME"
git config user.email "$EMAIL"

echo "Committing changes..."
git commit -m "$MESSAGE"

if $PUSH; then
  echo "Pushing to remote origin..."
  git push origin main
fi
