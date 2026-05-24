#!/bin/bash
# setup/cron-sync.sh — Install 12-hour sync cron job on VPS
#
# Usage:
#   bash setup/cron-sync.sh              # install/replace
#   bash setup/cron-sync.sh --remove     # remove cron job
#
# Runs every 12 hours:
#   0 */12 * * * cd /var/www/technodel.net && /usr/bin/node scripts/sync-engine.js >> /var/log/technodel-sync.log 2>&1

set -e

CRON_JOB='0 */12 * * * cd /var/www/technodel.net && /usr/bin/node scripts/sync-engine.js >> /var/log/technodel-sync.log 2>&1'
CRON_TAG="# technodel-sync-engine"

if [ "$1" = "--remove" ]; then
  echo "Removing technodel sync cron job..."
  crontab -l 2>/dev/null | grep -v "$CRON_TAG" | grep -v "sync-engine" | crontab -
  echo "Done"
  exit 0
fi

if crontab -l 2>/dev/null | grep -q "sync-engine"; then
  echo "Updating existing cron..."
  crontab -l 2>/dev/null | grep -v "$CRON_TAG" | grep -v "sync-engine" > /tmp/cron.tmp
  echo "$CRON_JOB $CRON_TAG" >> /tmp/cron.tmp
  crontab /tmp/cron.tmp
  rm -f /tmp/cron.tmp
else
  echo "Installing 12-hour sync cron..."
  (crontab -l 2>/dev/null; echo "$CRON_JOB $CRON_TAG") | crontab -
fi

echo "Done. Sync runs every 12 hours. Logs: /var/log/technodel-sync.log"
echo "Remove: bash setup/cron-sync.sh --remove"
