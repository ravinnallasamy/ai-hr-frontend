# HR Frontend - AI HR System

React + TypeScript frontend application for HR personnel to manage candidates and conduct AI-powered interviews.

## Features

- **Secure Authentication**: JWT-based login system
- **Candidate Dashboard**: View, search, and filter all candidates
- **Detailed Candidate Profiles**: View resumes, social links, and scraped profile data
- **AI-Powered Interviews**: Ask questions via text or voice input and receive AI-generated answers
- **Interview History**: Track all questions and answers for each candidate
- **Status Management**: Approve or reject candidates with one click
- **Voice Input**: Use browser's speech recognition API for hands-free question input

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Running backend server (see `/backend/README.md`)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `/hr` directory:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

   For production, set this to your backend server URL:
   ```env
   VITE_BACKEND_URL=https://api.yourdomain.com
   ```

## Development

**Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

**Default login credentials:**
- Email: `hr@example.com`
- Password: `password`

> **Note**: These are the default credentials from the database setup. Change them in production!

## Building for Production

**Create a production build:**
```bash
npm run build
```

The optimized static files will be generated in the `/dist` directory.

**Preview the production build:**
```bash
npm run preview
```

## Deployment to Netlify

### Prerequisites
- GitHub account with your HR frontend code in a repository
- Netlify account (sign up at [netlify.com](https://netlify.com))

### Steps

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ai-hr-frontend.git
   git push -u origin main
   ```

2. **Create a new site on Netlify:**
   - Go to Netlify Dashboard → Add new site → Import an existing project
   - Connect your GitHub repository
   - Select the repository

3. **Configure build settings:**
   - **Base directory**: Leave empty (or `hr` if repo contains multiple folders)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Netlify will auto-detect these from `netlify.toml`

4. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `VITE_BACKEND_URL` = `https://your-backend.onrender.com`

5. **Deploy:**
   - Click "Deploy site"
   - Netlify will build and deploy automatically
   - Your site will be available at `https://your-site-name.netlify.app`

### Manual Deployment

If you prefer to deploy manually:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Drag and drop the `dist` folder** to Netlify's deploy area

3. **Set environment variables** in Netlify dashboard

### Custom Domain

1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow Netlify's DNS configuration instructions

## Project Structure

```
hr/
├── src/
│   ├── App.tsx              # Main app component
│   ├── pages/
│   │   ├── HRLogin.tsx      # Login page
│   │   ├── HRDashboard.tsx  # Candidate list
│   │   └── UserDetails.tsx  # Candidate detail view
│   ├── components/
│   │   ├── UserCard.tsx     # Candidate card component
│   │   ├── VoiceInput.tsx   # Voice input component
│   │   └── icons.tsx        # SVG icons
│   ├── services/
│   │   └── api.ts           # API client
│   └── types.ts             # TypeScript type definitions
├── public/
└── package.json
```

## Features in Detail

### Authentication
- JWT tokens stored in `localStorage`
- Automatic token validation on app load
- Automatic logout on token expiration

### Candidate Dashboard
- Real-time search with 300ms debounce
- Status filtering (All, Pending, Approved, Rejected)
- Server-side pagination
- Responsive card layout

### Candidate Details
- **Resume Viewer**: Embedded PDF display
- **Social Links**: Direct links to LinkedIn, GitHub, Portfolio
- **Scraped Data**: Automatically fetched and displayed
- **AI Q&A**: 
  - Text input with voice support
  - Real-time answer generation
  - Question history with timestamps
- **Status Management**: Quick approve/reject buttons

### Voice Input
- Uses Web Speech API (Chrome, Edge, Safari)
- Continuous recognition mode
- Visual feedback (microphone/stop icon)
- Auto-restart on premature end

## Browser Support

- Chrome/Edge: Full support including voice input
- Firefox: Full support (voice input may vary)
- Safari: Full support including voice input
- Mobile browsers: Responsive design supported

## Troubleshooting

- **Login fails**: Verify backend is running and credentials are correct
- **API errors**: Check `VITE_BACKEND_URL` in `.env`
- **Voice input not working**: Ensure browser supports Web Speech API and microphone permissions are granted
- **Build errors**: Clear `node_modules` and reinstall dependencies

## License

MIT
