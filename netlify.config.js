// Netlify build plugin configuration
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Preparing Simplify workflow management app for deployment...');
  },
  onBuild: () => {
    console.log('Build completed successfully!');
  },
  onPostBuild: ({ constants }) => {
    console.log(`Next.js app built to ${constants.PUBLISH_DIR}`);
  },
};
