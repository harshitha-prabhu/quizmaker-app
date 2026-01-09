# Deployment Guide

This guide covers the deployment process for the QuizMaker application to Cloudflare Workers using OpenNext.js Cloudflare adapter.

## Prerequisites

1. **Cloudflare Account**: Ensure you have a Cloudflare account with Workers access
2. **Wrangler CLI**: Installed and authenticated (`npm install -g wrangler` or use `npx wrangler`)
3. **Database**: D1 database created and configured in `wrangler.jsonc`
4. **Environment**: Node.js 18+ installed

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Code review completed

## Step 1: Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window for authentication.

## Step 2: Verify Database Configuration

Check that your D1 database is configured in `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "quizmaker_demo_app_database",
      "database_name": "quizmaker-demo-app-database",
      "database_id": "876ab727-21e2-480a-946f-e02103ebaafe",
      "remote": true
    }
  ]
}
```

## Step 3: Run Database Migrations

### 3.1 Local Development Database

For local development, create a local D1 database:

```bash
npx wrangler d1 create quizmaker-demo-app-database --local
```

Then run migrations locally:

```bash
# Run all migrations
npx wrangler d1 migrations apply quizmaker-demo-app-database --local

# Or run specific migration
npx wrangler d1 execute quizmaker-demo-app-database --local --file=./migrations/0001_create_users_table.sql
npx wrangler d1 execute quizmaker-demo-app-database --local --file=./migrations/0002_create_sessions_table.sql
```

### 3.2 Production Database

**⚠️ Important**: Run migrations on production database before deploying the application.

```bash
# Run all migrations on production
npx wrangler d1 migrations apply quizmaker-demo-app-database

# Or run specific migration
npx wrangler d1 execute quizmaker-demo-app-database --file=./migrations/0001_create_users_table.sql
npx wrangler d1 execute quizmaker-demo-app-database --file=./migrations/0002_create_sessions_table.sql
```

### 3.3 Verify Migrations

Verify that tables were created:

```bash
# Local
npx wrangler d1 execute quizmaker-demo-app-database --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Production
npx wrangler d1 execute quizmaker-demo-app-database --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:
- `users`
- `sessions`

## Step 4: Build the Application

```bash
npm run build
```

This will:
1. Build the Next.js application
2. Generate the OpenNext.js Cloudflare adapter output
3. Prepare the application for deployment

## Step 5: Deploy to Cloudflare Workers

### 5.1 Preview Deployment (Recommended First)

Test the deployment in preview mode:

```bash
npm run preview
```

This will:
- Build the application
- Start a local preview server
- Allow you to test the deployment locally before pushing to production

### 5.2 Production Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

This command:
1. Builds the application (`opennextjs-cloudflare build`)
2. Deploys to Cloudflare Workers (`opennextjs-cloudflare deploy`)

### 5.3 Alternative: Upload Only

If you've already built and just want to upload:

```bash
npm run upload
```

## Step 6: Verify Deployment

### 6.1 Check Deployment Status

After deployment, check the Cloudflare dashboard or use Wrangler:

```bash
npx wrangler deployments list
```

### 6.2 Test Application

1. **Home Page**: Visit the root URL
   - Should redirect authenticated users to `/dashboard`
   - Should show login/register links for unauthenticated users

2. **Registration**: 
   - Visit `/register`
   - Create a new account
   - Verify redirect to `/dashboard`

3. **Login**:
   - Visit `/login`
   - Login with created account
   - Verify redirect to `/dashboard`

4. **Dashboard**:
   - Verify user information displays
   - Verify navigation works
   - Test logout functionality

5. **Protected Routes**:
   - Logout and try accessing `/dashboard`
   - Should redirect to `/login`

## Step 7: Monitor and Troubleshoot

### 7.1 View Logs

```bash
# Real-time logs
npx wrangler tail

# Filter logs
npx wrangler tail --format pretty
```

### 7.2 Common Issues

#### Issue: Database Binding Error
**Error**: `Database access failed: CloudflareEnv not found`

**Solution**: 
- Verify `wrangler.jsonc` has correct database binding
- Ensure database ID matches Cloudflare dashboard
- Run `npm run cf-typegen` to regenerate types

#### Issue: Migration Errors
**Error**: `Table already exists`

**Solution**:
- Check if migrations were already run
- Use `--skip-migrations` if needed
- Or manually drop tables if starting fresh

#### Issue: Build Errors
**Error**: TypeScript or build errors

**Solution**:
- Run `npm run lint` to check for issues
- Ensure all dependencies are installed (`npm install`)
- Check TypeScript configuration

#### Issue: Authentication Not Working
**Error**: Sessions not persisting

**Solution**:
- Verify cookies are being set (check browser DevTools)
- Check session table in database
- Verify `SESSION_CONFIG.COOKIE_NAME` matches cookie name
- Check cookie settings (httpOnly, secure, sameSite)

## Environment Variables

If you need to set environment variables for production:

```bash
# Set secret (encrypted)
npx wrangler secret put SECRET_NAME

# Set variable (plain text)
npx wrangler secret put VARIABLE_NAME --text
```

## Rollback

If you need to rollback to a previous deployment:

1. Check deployment history:
   ```bash
   npx wrangler deployments list
   ```

2. Rollback to specific version:
   ```bash
   npx wrangler rollback [DEPLOYMENT_ID]
   ```

## Continuous Deployment

For CI/CD integration, you can use:

```yaml
# Example GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Production Best Practices

1. **Database Backups**: Regularly backup your D1 database
   ```bash
   npx wrangler d1 export quizmaker-demo-app-database --output=backup.sql
   ```

2. **Monitoring**: Set up error tracking (e.g., Sentry, Cloudflare Analytics)

3. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints

4. **Security**: 
   - Ensure HTTPS is enabled (automatic with Cloudflare)
   - Review cookie security settings
   - Regularly update dependencies

5. **Performance**: 
   - Monitor response times
   - Optimize database queries
   - Use Cloudflare caching where appropriate

## Support

For issues or questions:
1. Check Cloudflare Workers documentation
2. Review OpenNext.js Cloudflare adapter documentation
3. Check application logs: `npx wrangler tail`

## Next Steps

After successful deployment:
1. Monitor application performance
2. Set up error tracking
3. Configure analytics
4. Proceed with MCQ CRUD implementation (Phase 1 of MCQ_CRUD.md)

