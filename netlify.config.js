// Netlify build plugin configuration for Simplify app
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Preparing Simplify workflow management app for deployment...');
    
    // Check for required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_CLAUDE_API_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
      console.warn('These should be set in the Netlify UI under Site settings > Build & deploy > Environment');
    }
  },
  
  onBuild: () => {
    console.log('Building Simplify Next.js application...');
  },
  
  onPostBuild: ({ constants }) => {
    console.log(`Next.js app built successfully to ${constants.PUBLISH_DIR}`);
    console.log('Verifying build output...');
  },
  
  onSuccess: () => {
    console.log('Deployment successful! Your Simplify app is now live.');
  },
  
  onError: ({ error }) => {
    console.error('Deployment failed with error:', error);
    console.log('Check your build settings and environment variables.');
  }
};
