# Supabase Setup Instructions

This document provides step-by-step instructions for setting up the database schema in your Supabase project.

## 📋 Prerequisites

1. **Supabase Project**: You already have a project at `https://chkanafpmtzskekeruem.supabase.co`
2. **Environment Variables**: Configured in `.env.local`
3. **Migration Files**: Available in `supabase/migrations/`

## 🚀 Database Schema Setup

### Option 1: SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/chkanafpmtzskekeruem
   - Go to: **SQL Editor** in the left sidebar

2. **Execute Migration Script**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   - Go to: **Table Editor** in the left sidebar
   - Confirm `transactions` table exists with correct structure

### Option 2: CLI (If Access Token Available)

```bash
# Login to Supabase CLI (requires access token)
supabase login

# Link local project to remote
supabase link --project-ref chkanafpmtzskekeruem

# Push migration to remote database
supabase db push
```

## 📊 Database Schema Overview

### Tables Created

#### `transactions` Table

- **Purpose**: Store Bitcoin transaction records with comprehensive tax tracking
- **Structure**: Matches `OptimizedTransaction` interface exactly
- **Features**:
  - Row Level Security (RLS) enabled
  - User isolation via `user_id` foreign key
  - Automatic `updated_at` timestamp updates
  - Data integrity constraints

### Key Features

#### 🔐 Row Level Security (RLS)

- **Enabled**: Users can only access their own transactions
- **Policies**:
  - SELECT: Users can view own transactions
  - INSERT: Users can insert own transactions
  - UPDATE: Users can update own transactions
  - DELETE: Users can delete own transactions

#### 🗃️ Indexes for Performance

- `user_id` for user-specific queries
- `date DESC` for chronological sorting
- `exchange` for filtering by exchange
- `type` for filtering by transaction type
- Composite indexes for common query patterns

#### ✅ Data Integrity Constraints

- Positive USD amounts and prices
- Non-zero Bitcoin amounts
- Valid date ranges
- Optional network fee validation

## 🔧 Post-Setup Verification

### Test Database Connection

1. **Check Environment Variables**

   ```bash
   # Verify environment variables are set
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Test RLS Policies**
   - Create a test user account
   - Verify data isolation between users
   - Confirm anonymous users cannot access data

3. **Performance Testing**
   - Insert sample transaction data
   - Test query performance with indexes
   - Verify constraint enforcement

## 🚀 Next Steps

After database setup is complete:

1. **Create Storage Provider Interface** (`IStorageProvider`)
2. **Implement SupabaseStorageProvider** class
3. **Add Authentication Integration**
4. **Test Migration from localStorage to Supabase**

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Verify you have admin access to the Supabase project
   - Check that you're logged into the correct account

2. **Migration Fails**
   - Check for syntax errors in SQL
   - Verify PostgreSQL version compatibility
   - Review error messages in Supabase logs

3. **RLS Not Working**
   - Confirm `auth.uid()` returns correct user ID
   - Test policies with different user contexts
   - Verify foreign key relationship to `auth.users`

## 📖 References

- [Supabase SQL Editor](https://app.supabase.com/project/chkanafpmtzskekeruem/sql)
- [Supabase Table Editor](https://app.supabase.com/project/chkanafpmtzskekeruem/editor)
- [Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
