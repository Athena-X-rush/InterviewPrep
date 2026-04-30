
1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect to your GitHub repository
4. Set build settings:
    `server`
    `npm install`
    `node index.js`
5. Add environment variables:
   - `GROQ_API_KEY` - Your Groq API key
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Any random string for JWT signing
6. Click "Create Web Service"

    If you need a PostgreSQL database:
- In Render, click "New" → "PostgreSQL"
- Render will provide the `DATABASE_URL` automatically


1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Set build settings:
   `npm run build`
   `client/build`
   `client`
5. Add environment variable:
   - `REACT_APP_API_URL` - Your Render server URL (e.g., `https://your-app.onrender.com/api`)
6. Click "Deploy site"


Environment Variables

Server (Render)
 - `GROQ_API_KEY` - Required for AI features
 - `DATABASE_URL` - PostgreSQL connection
 - `JWT_SECRET` - JWT signing secret

Client (Netlify)
 - `REACT_APP_API_URL` - Backend API URL (e.g., `https://your-app.onrender.com/api`)


Post-Deployment

1. After Render deploys, copy the server URL from Render dashboard
2. Update Netlify environment variable `REACT_APP_API_URL` with the Render server URL
3. Redeploy Netlify to apply the change
