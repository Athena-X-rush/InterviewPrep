# InterviewPrep

An AI-powered interview practice app that helps you prepare for technical interviews with quizzes, AI feedback, and study plans.

## Features

- **Quiz Mode**: Practice with multiple-choice questions on various topics
- **AI Interview**: Practice free-form answers with real-time AI evaluation
- **Resume Analysis**: Upload your resume to get gap analysis and tailored questions
- **Document Analysis**: Upload study materials to generate custom questions
- **Leaderboard**: See how you rank against other users
- **AI Feedback**: Get detailed feedback on your answers with improvement suggestions

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **AI**: Groq API for question generation and answer evaluation

## Local Setup

### Prerequisites

- Node.js installed
- PostgreSQL database (or use Supabase)

### Backend Setup

1. Go to the server folder:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server folder:
```
PORT=5050
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:3000
GROQ_API_KEY=your_groq_api_key
```

4. Start the server:
```bash
npm start
```

### Frontend Setup

1. Go to the client folder:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm start
```

The app will open at http://localhost:3000

## Deployment

- **Backend**: Deployed on Render
- **Frontend**: Deployed on Netlify
- **Database**: Supabase PostgreSQL

See `DEPLOYMENT.md` for detailed deployment instructions.

## Screenshots

<!-- Add your screenshots here -->

## Getting Started

1. Sign up for an account
2. Choose a mode (Quiz, Interview, Resume, or Document)
3. Start practicing and get AI feedback

## License

MIT
