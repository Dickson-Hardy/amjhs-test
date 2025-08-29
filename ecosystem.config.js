{
  "apps": [
    {
      "name": "amhsj-prod",
      "script": "npm",
      "args": "start",
      "cwd": "./",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "development",
        "PORT": 3000
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3000,
        "ENABLE_REAL_APIS": true,
        "ENABLE_MONITORING": true,
        "ENABLE_ANALYTICS": true
      },
      "log_file": "./logs/app/combined.log",
      "out_file": "./logs/app/out.log",
      "error_file": "./logs/app/error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "kill_timeout": 5000,
      "restart_delay": 1000,
      "max_restarts": 10,
      "min_uptime": "10s",
      "max_memory_restart": "500M",
      "node_args": "--max-old-space-size=4096",
      "watch": false,
      "ignore_watch": [
        "node_modules",
        "logs",
        "backups",
        ".git"
      ],
      "watch_options": {
        "followSymlinks": false
      },
      "source_map_support": true,
      "instance_var": "INSTANCE_ID",
      "autorestart": true,
      "vizion": false,
      "post_update": ["npm install", "npm run build"],
      "force": true
    },
    {
      "name": "amhsj-worker",
      "script": "./scripts/worker.js",
      "cwd": "./",
      "instances": 2,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "development",
        "WORKER_TYPE": "background"
      },
      "env_production": {
        "NODE_ENV": "production",
        "WORKER_TYPE": "background",
        "ENABLE_REAL_APIS": true
      },
      "log_file": "./logs/app/worker.log",
      "out_file": "./logs/app/worker-out.log",
      "error_file": "./logs/app/worker-error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "200M",
      "kill_timeout": 10000,
      "restart_delay": 2000
    }
  ],
  "deploy": {
    "production": {
      "user": "deploy",
      "host": ["amhsj.org"],
      "ref": "origin/main",
      "repo": "https://github.com/your-username/amhsj.git",
      "path": "/var/www/amhsj",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save"
    },
    "staging": {
      "user": "deploy",
      "host": ["staging.amhsj.org"],
      "ref": "origin/develop",
      "repo": "https://github.com/your-username/amhsj.git",
      "path": "/var/www/amhsj-staging",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env staging && pm2 save"
    }
  }
}
