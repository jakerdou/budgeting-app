# GitHub Pages Deployment Setup

Your Expo frontend is now configured for GitHub Pages deployment! Here's what has been set up and what you need to do next:

## What's Been Configured

✅ **App Configuration (`app.json`)**
- Added `baseUrl: "/budgeting-app/"` for GitHub Pages
- Web platform is properly configured

✅ **Build Script (`package.json`)**
- Added `npm run build` command
- Automatically copies 404.html for proper routing

✅ **GitHub Actions Workflow (`.github/workflows/deploy.yml`)**
- Automated deployment on push to master branch
- Builds and deploys to GitHub Pages

✅ **SPA Routing Support (`404.html`)**
- Handles client-side routing for Expo Router

## Next Steps

### 1. Commit and Push Your Changes
```bash
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin master
```

### 2. Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: https://github.com/jakerdou/budgeting-app
2. Click on **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 3. Trigger the First Deployment
Once you push your changes, the GitHub Action will automatically run and deploy your site.

Your app will be available at: **https://jakerdou.github.io/budgeting-app/**

## Manual Testing

You can test the build locally:
```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` folder.

## Important Notes

- The deployment triggers automatically when you push to the `master` branch
- Your API endpoints need to be accessible from the deployed site
- Make sure your `.env` variables are properly configured for production
- The GitHub Action uses Node.js 18 and caches dependencies for faster builds

## Troubleshooting

If the deployment fails:
1. Check the **Actions** tab in your GitHub repository
2. Look at the build logs for any errors
3. Ensure all dependencies are properly listed in `package.json`
4. Verify that the build works locally first

## Environment Variables

Don't forget to configure any necessary environment variables for production in your deployment environment or ensure they're handled properly in your app code.
