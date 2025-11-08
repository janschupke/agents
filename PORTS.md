# Port Configuration

This project uses multiple services running on different ports:

## Port Assignments

- **Backend API**: `3001` (NestJS)
- **Frontend**: `3000` (Vite/React)
- **Admin Portal**: `3002` (Vite/React)

## Running Development Servers

### All Services (Recommended)

```bash
pnpm dev
```

This uses `concurrently` to run all three services with colored output:
- Backend (blue)
- Frontend (green)  
- Admin (yellow)

### Individual Services

```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend

# Admin only
pnpm dev:admin
```

## Port Conflicts

If you encounter `EADDRINUSE` errors:

### Check What's Using a Port

```bash
# Check port 3001 (backend)
lsof -i :3001

# Check port 3000 (frontend)
lsof -i :3000

# Check port 3002 (admin)
lsof -i :3002
```

### Kill Processes Using a Port

```bash
# Find and kill process on port 3001
kill $(lsof -t -i:3001)

# Or kill specific PID
kill <PID>
```

### Common Issues

1. **Multiple Backend Instances**: If you see multiple `nest start --watch` processes, kill the old ones:
   ```bash
   pkill -f "nest start --watch"
   ```

2. **Stale Processes**: Sometimes processes don't exit cleanly. Check for zombie processes:
   ```bash
   ps aux | grep -E "(node|vite|nest)" | grep -v grep
   ```

3. **Port Already in Use**: Make sure you're not running services manually in separate terminals while also using `pnpm dev`.

## Configuration

Ports are configured in:
- **Backend**: `packages/backend/src/config/app.config.ts` (default: 3001)
- **Frontend**: `packages/frontend/vite.config.ts` (default: 3000)
- **Admin**: `packages/admin/vite.config.ts` (default: 3002)

To change ports, update the respective config files and ensure they don't conflict.
