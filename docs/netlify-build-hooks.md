# Netlify Build Hooks for Simplify

This guide explains how to set up and use Netlify Build Hooks to trigger deployments of your Simplify workflow management application.

## What are Build Hooks?

Build hooks are unique URLs that trigger a new build and deploy when called. They're useful for:

- Triggering builds after content changes in Supabase
- Setting up scheduled deployments
- Integrating with external services

## Setting Up a Build Hook

1. **Create a Build Hook in Netlify**
   - Go to your site settings in Netlify
   - Navigate to "Build & deploy" > "Continuous deployment" > "Build hooks"
   - Click "Add build hook"
   - Give it a name (e.g., "Supabase Update")
   - Select the branch to build (usually "main")
   - Copy the generated URL

2. **Using the Build Hook**
   - Trigger a build by sending a POST request to the hook URL:
   ```bash
   curl -X POST -d {} https://api.netlify.com/build_hooks/your-hook-id
   ```

## Integration Examples

### Supabase Database Webhook

You can set up Supabase to trigger your Netlify build when data changes:

1. In Supabase, create a database function:
   ```sql
   CREATE FUNCTION trigger_netlify_build() RETURNS trigger AS $$
   BEGIN
     PERFORM http.post(
       'https://api.netlify.com/build_hooks/your-hook-id',
       '{}'::jsonb
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. Create a trigger on your table:
   ```sql
   CREATE TRIGGER trigger_netlify_after_workflow_change
   AFTER INSERT OR UPDATE OR DELETE ON workflows
   FOR EACH STATEMENT EXECUTE PROCEDURE trigger_netlify_build();
   ```

### Scheduled Builds

To set up scheduled builds (e.g., daily at midnight):

1. Use a service like GitHub Actions:
   ```yaml
   # .github/workflows/scheduled-build.yml
   name: Scheduled Netlify Build
   on:
     schedule:
       - cron: '0 0 * * *'  # Midnight every day
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Netlify build
           run: curl -X POST -d {} https://api.netlify.com/build_hooks/your-hook-id
   ```

## Security Considerations

- Keep your build hook URLs secure, as anyone with the URL can trigger a build
- Consider using environment variables to store the build hook URL in your scripts
- For sensitive integrations, use additional authentication methods

## Monitoring Build Hook Usage

- In Netlify, go to "Deploys" to see which builds were triggered by build hooks
- Each build triggered by a hook will be labeled as "Deploy triggered by hook"

## Troubleshooting

- If your build hook isn't working, verify the URL is correct
- Check that the service calling the hook can reach the Netlify API
- Ensure your POST request is formatted correctly
