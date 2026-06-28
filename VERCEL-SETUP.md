# Vercel Deployment Setup Guide

## Step 1: Deploy to Vercel

If you haven't deployed yet:

1. **Go to**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. Vercel will auto-detect it's a Vite app - just click **Deploy**

## Step 2: Configure Environment Variables

**IMPORTANT**: Your app needs Supabase credentials to work properly.

1. **Go to your Vercel dashboard**: https://vercel.com/dashboard
2. **Click on your project**
3. **Go to Settings** → **Environment Variables**
4. **Add these two variables**:

### Variable 1:
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://0ec90b57d6e95fcbda19832f.supabase.co`
- **Environment**: Select all 3 (Production, Preview, Development)

### Variable 2:
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: (copy the value of VITE_SUPABASE_ANON_KEY from your project's `.env` file)
- **Environment**: Select all 3 (Production, Preview, Development)

## Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

OR simply push a new commit to your GitHub repo and Vercel will auto-deploy.

## What This Fixes

With these environment variables set, your inventory management app will:
- ✅ Connect to your Supabase database
- ✅ Automatically reduce stock when you make sales (the trigger will work!)
- ✅ Store all data persistently
- ✅ Sync across all devices
- ✅ Handle PIN authentication properly

## Quick Access Links

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/rljmsqmzucindvulbvlj
