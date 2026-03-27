#!/usr/bin/env bash
set -euo pipefail

# Basic production safeguards for a small Ubuntu droplet.
# Run as root on the server:
#   sudo bash scripts/setup-droplet-safeguards.sh

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (sudo)." >&2
  exit 1
fi

echo "[1/7] apt update"
apt-get update -y

echo "[2/7] install base packages"
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ufw \
  fail2ban \
  unattended-upgrades \
  apt-listchanges \
  logrotate \
  curl \
  ca-certificates

echo "[3/7] enable unattended upgrades"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "[4/7] configure firewall (allow 22,80,443)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[5/7] configure fail2ban (sshd)"
cat >/etc/fail2ban/jail.d/questboard-sshd.local <<'EOF'
[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable fail2ban
systemctl restart fail2ban

echo "[6/7] ensure 2G swapfile"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
fi
if ! grep -q '^/swapfile ' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50
cat >/etc/sysctl.d/99-questboard-swap.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF

echo "[7/7] write logrotate config for app logs"
cat >/etc/logrotate.d/questboard <<'EOF'
/var/log/questboard/*.log {
  daily
  rotate 14
  missingok
  notifempty
  compress
  delaycompress
  copytruncate
}
EOF
mkdir -p /var/log/questboard
chmod 755 /var/log/questboard

echo "Safeguards configured."
echo "Next: deploy app with PM2 + reverse proxy + backups."
