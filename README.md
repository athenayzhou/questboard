# questboard

maintains, organizes, and keeps track of chores to help me manage my chore workload

board with quests posted on it that each help do a chore
quest = paper with required actions listed, upon completion of set action promises a reward typically virtual currency

## deployment safeguards (digitalocean $5 droplet)

For small beta traffic, use these scripts on your Ubuntu droplet:

1) Baseline hardening + safety defaults:

```bash
sudo bash scripts/setup-droplet-safeguards.sh
```

This configures:
- ufw firewall (`22`, `80`, `443`)
- fail2ban for ssh
- unattended security upgrades
- 2G swap
- log rotation for `/var/log/questboard/*.log`

2) Postgres backups:

```bash
DATABASE_URL="postgres://..." bash scripts/postgres-backup.sh
```

Recommended cron (daily at 3am UTC):

```bash
0 3 * * * DATABASE_URL='postgres://...' BACKUP_DIR='/var/backups/questboard-postgres' KEEP_DAYS='14' /bin/bash /path/to/repo/scripts/postgres-backup.sh >> /var/log/questboard/postgres-backup.log 2>&1
```

### what to run and where

#### local machine (your laptop)

1) push code to `main`:

```bash
git checkout main
git pull --ff-only
git merge feature/collab
git push origin main
```

#### server (digitalocean droplet)

2) one-time setup after creating droplet:

```bash
cd /path/to/questboard
sudo bash scripts/setup-droplet-safeguards.sh
chmod +x scripts/deploy.sh scripts/postgres-backup.sh
```

3) each deploy:

```bash
cd /path/to/questboard
bash scripts/deploy.sh
```

4) test backup manually once:

```bash
cd /path/to/questboard
DATABASE_URL='postgres://...' bash scripts/postgres-backup.sh
```

## quest based system

user generated quest

- input chore
- category: cooking, cleaning, etc (user created tags)
- difficulty: easy, medium, hard
- priority: high/urgent, low/flexible
- frequency: one time, daily, weekly, monthly, custom
- time duration
- deadline
- subquests
- chore turns into new quest added to quest board

## components

- board: freely rearrange quests, visible information (name, difficulty, time left), select quest to expand details (instructions/description, subquest, etc)
- quest page: expand information, edit information, accept/delete quest
- accept quest: adds quest to dashboard as active quest
- system generated quests: notification about quest issue pops up, accept (quest added to dashboard), defer (quest added to quest board) or reject
  - reoccurring quests (e.g. weekly dishes)
  - seasonal quests (e.g. spring cleaning, set clocks for daylight savings)
  - customized/personalized quests (e.g. bake dessert with chocolate if skill proficiency in baking is about to increase, introduce new branch like create own jam/syrup and after leveling baking skill, canning/preservation skill branches)
- quest templates: use pre-set templates for common chores, reissue past chore
- quest completion: completion marked, reward (currency/item) on quest awarded, exp for skill awarded
