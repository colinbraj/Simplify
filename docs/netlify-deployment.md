# Netlify Deployment Guide for Simplify

This guide will help you deploy your Simplify workflow management application to Netlify.

## Prerequisites

1. A Netlify account
2. Your Simplify project pushed to a GitHub repository
3. Supabase project set up with necessary tables and API keys
4. Claude API key

## Deployment Steps

### 1. Connect to Netlify

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub repositories
5. Select your Simplify repository

### 2. Configure Build Settings

The build settings should be automatically detected from your `netlify.toml` file, but verify the following:

- Build command: `npm run build`
- Publish directory: `.next`

### 3. Environment Variables

Add the following environment variables in Netlify's site settings:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_CLAUDE_API_KEY`: Your Claude API key
- `NEXT_PUBLIC_SITE_URL`: Your Netlify site URL (after deployment)

### 4. Deploy

Click "Deploy site" and wait for the build to complete.

### 5. Custom Domain (Optional)

1. Go to "Domain settings" in your site dashboard
2. Click "Add custom domain"
3. Follow the instructions to set up your domain

## Continuous Deployment

Netlify will automatically deploy your site when you push changes to your GitHub repository.

## Troubleshooting

- If you encounter build errors, check the build logs for specific error messages
- Ensure all environment variables are correctly set
- Verify that your Supabase and Claude API keys are valid
- Check that your Next.js configuration is compatible with Netlify

## Local Testing

Before deploying, test your site locally with:

```bash
npm run build
npm start
```

This will build your site and serve it locally, similar to how it will run on Netlify.
