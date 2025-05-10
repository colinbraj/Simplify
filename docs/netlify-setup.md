# Netlify Setup Guide for Simplify

This guide provides step-by-step instructions for setting up your Simplify workflow management application on Netlify.

## Initial Setup

1. **Create a Netlify Account**
   - Sign up at [netlify.com](https://netlify.com) if you don't already have an account

2. **Install Netlify CLI (Optional)**
   - For local testing and deployment:
   ```bash
   npm install netlify-cli -g
   netlify login
   ```

## Deploying to Netlify

### Option 1: Deploy via Netlify UI

1. **Connect to GitHub**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Choose GitHub as your Git provider
   - Authorize Netlify to access your repositories
   - Select your Simplify repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - The `netlify.toml` file in your project should automatically configure these settings

3. **Set Environment Variables**
   - In your site settings, go to "Environment" > "Environment variables"
   - Add the following variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_CLAUDE_API_KEY`
     - `NEXT_PUBLIC_SITE_URL` (set to your Netlify URL after deployment)

4. **Deploy**
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Initialize Netlify Site**
   ```bash
   cd c:\Users\Colin Lourdes\Desktop\Windsurf\Simplify
   netlify init
   ```

2. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL your-supabase-url
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY your-supabase-anon-key
   netlify env:set NEXT_PUBLIC_CLAUDE_API_KEY your-claude-api-key
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Configuration

1. **Custom Domain (Optional)**
   - In your Netlify site dashboard, go to "Domain settings"
   - Click "Add custom domain" and follow the instructions

2. **Enable Forms (If Needed)**
   - If your application uses Netlify Forms, add the following to your form HTML:
   ```html
   <form name="contact" netlify>
   ```

3. **Set Up Continuous Deployment**
   - Netlify automatically sets up continuous deployment from your GitHub repository
   - Each push to your main branch will trigger a new deployment

## Monitoring and Troubleshooting

1. **View Deployment Logs**
   - Go to your site's "Deploys" tab to view build logs

2. **Function Logs**
   - For serverless functions, check the "Functions" tab

3. **Local Testing**
   ```bash
   netlify dev
   ```

## Additional Resources

- [Netlify Docs for Next.js](https://docs.netlify.com/integrations/frameworks/next-js/overview/)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

## Notes for Simplify

- The Claude API integration requires proper environment variable configuration
- Ensure Supabase security rules are properly set up for production
- Consider using Netlify Identity if you need additional authentication options
