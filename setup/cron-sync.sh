#!/bin/bash
# =============================================================================
# Technodel.net — 6-Hour Sync Cron Installer
# =============================================================================
# Run this script ONCE on the VPS to enable auto-sync every 6 hours.
#
# Usage:
#   chmod +x setup/cron-sync.sh
#   bash setup/cron-sync.sh
#
# This script installs a cron job that:
#   - Runs every 6 hours at midnight, 6am, noon, 6pm
#   - Executes sync-engine.js with production env
#   - Logs output to /var/log/technodel-sync.log
#
# Prerequisites:
#   - Node.js installed on the VPS
#   - ALL-MALL DB accessible (set ALL_MALL_DB_PATH in .env.sync)
#   - Prisma client generated (run: npx prisma generate)
#   - Run from the project root directory
# =============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRON_LOG="/var/log/technodel-sync.log"
CRON_JOB="0 */6 * * * cd ${PROJECT_DIR} && /usr/bin/node scripts/sync-engine.js >> ${CRON_LOG} 2>&1"

echo "=========================================="
echo " Technodel Sync Cron Installer"
echo "=========================================="
echo ""
echo "Project: ${PROJECT_DIR}"
echo "Log:     ${CRON_LOG}"
echo ""

# Validate project directory
if [ ! -f "${PROJECT_DIR}/scripts/sync-engine.js" ]; then
  echo "❌ Error: sync-engine.js not found in ${PROJECT_DIR}"
  echo "   Run this script from the project root directory."
  exit 1
fi

# Check node exists
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js not found. Install Node.js first."
  exit 1
fi

# Check .env.sync exists
if [ ! -f "${PROJECT_DIR}/.env.sync" ]; then
  echo "⚠️  Warning: .env.sync not found. Creating from .env..."
  if [ -f "${PROJECT_DIR}/.env" ]; then
    grep "ALL_MALL_DB_PATH" "${PROJECT_DIR}/.env" > "${PROJECT_DIR}/.env.sync" 2>/dev/null || true
    echo "DATABASE_URL=\"file:./prisma/dev.db\"" >> "${PROJECT_DIR}/.env.sync"
    echo "   Created .env.sync from .env"
  else
    echo "   ⚠️  No .env found either. You'll need to create .env.sync manually."
  fi
fi

# Ensure log file exists and is writable
sudo touch "${CRON_LOG}" 2>/dev/null || touch "${CRON_LOG}"
sudo chmod 666 "${CRON_LOG}" 2>/dev/null || true

# Test the sync first (dry run)
echo "Running dry-run test (this takes ~30s)..."
cd "${PROJECT_DIR}"
DRY_RUN=true node scripts/sync-engine.js
echo ""

# Install cron job
echo "Installing cron job..."
# Check if it already exists
if crontab -l 2>/dev/null | grep -q "sync-engine.js"; then
  echo "⚠️  Cron job already exists. Removing old entry and reinstalling..."
  (crontab -l 2>/dev/null | grep -v "sync-engine.js") | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -

echo "✅ Cron job installed!"
echo "   Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)"
echo "   Command:  ${CRON_JOB}"
echo "   Log:      ${CRON_LOG}"
echo ""
echo "To verify:"
echo "  crontab -l"
echo ""
echo "To view sync output:"
echo "  tail -f ${CRON_LOG}"
echo ""
echo "To remove later:"
echo "  crontab -l | grep -v sync-engine.js | crontab -"
echo ""
echo "=========================================="
