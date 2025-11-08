# Clerk Webhook Setup

This application uses Clerk webhooks to automatically sync user data and roles between Clerk and the database.

## Webhook Configuration

### 1. Get Webhook Secret

1. Go to your Clerk Dashboard
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
5. Select the events to listen to:
   - `user.created`
   - `user.updated`
6. Copy the **Signing Secret** (starts with `whsec_`)

### 2. Set Environment Variable

Add the webhook secret to your backend `.env` file:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Role Management

The webhook automatically:

- Sets `roles: ["user"]` for all new users who sign up
- Sets `roles: ["user"]` for existing users who don't have roles metadata
- Syncs roles between Clerk's `public_metadata.roles` and the database

### 4. Supported Roles

- `user` - Default role for all users
- `admin` - Administrative role (can be assigned manually in Clerk Dashboard)

### 5. Manual Role Assignment

To assign roles to users:

1. Go to Clerk Dashboard → **Users**
2. Select a user
3. Go to **Metadata** tab
4. Under **Public metadata**, add:
   ```json
   {
     "roles": ["user", "admin"]
   }
   ```
5. The webhook will automatically sync this to the database on the next `user.updated` event

### 6. Sync Existing Users

To sync roles for all existing users (one-time operation), you can call the `syncAllUserRoles` method from the `ClerkWebhookService`. This will:

- Check all users in Clerk
- Set `roles: ["user"]` for users without roles
- Sync roles to the database

## Webhook Endpoint

- **URL**: `POST /api/webhooks/clerk`
- **Authentication**: Public (uses Svix signature verification)
- **Events Handled**:
  - `user.created` - Creates user in DB with default `["user"]` role
  - `user.updated` - Updates user in DB and syncs roles

## Local Development

### Option 1: Development Mode (No Webhook Secret Required)

For local development, you can run without a webhook secret. The application will:

- Accept webhooks without signature verification
- Process webhook events normally
- Log warnings about missing verification

**Setup:**

1. Simply don't set `CLERK_WEBHOOK_SECRET` in your `.env` file
2. The webhook endpoint will still work, but without verification

**Note:** This is only safe in development. Production requires webhook verification.

### Option 2: Use ngrok for Full Webhook Testing

For testing with actual Clerk webhooks (recommended for integration testing):

1. **Install ngrok:**

   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your backend:**

   ```bash
   cd packages/backend
   pnpm dev
   ```

3. **Expose your local server:**

   ```bash
   ngrok http 3001
   ```

4. **Configure Clerk webhook:**
   - Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`
   - Copy the signing secret and add to `.env`:
     ```env
     CLERK_WEBHOOK_SECRET=whsec_...
     ```

5. **Test the webhook:**
   - Create a new user in Clerk
   - Check your backend logs for webhook events
   - Verify the user was created in your database with roles

### Option 3: Manual Testing (Without Webhooks)

If you don't need webhook testing during development:

- Users will be created/synced when they first sign in (via `ClerkGuard`)
- Roles will be set to `["user"]` by default
- You can manually update roles in Clerk Dashboard → Users → Metadata

### Production Setup

In production, you **must**:

1. Set `CLERK_WEBHOOK_SECRET` in your environment variables
2. Configure the webhook in Clerk Dashboard with your production URL
3. Ensure your production server is publicly accessible

The webhook endpoint will reject requests without proper signature verification in production mode.
