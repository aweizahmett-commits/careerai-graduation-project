# Career AI Frontend

A modern frontend application for AI-powered career recommendations built with React, Vite, TypeScript, and TailwindCSS.

## Features

- **User Authentication**: Login and registration system
- **Career Assessment**: Interactive questionnaire for career matching
- **Resume Upload**: AI-powered resume analysis
- **AI Recommendations**: Personalized career path suggestions
- **Job Search**: Comprehensive job search with filtering
- **User Profile**: Manage personal information and preferences
- **Dashboard**: Overview of user's career journey

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Project Structure

```
src/
├── api/           # API configuration and axios setup
├── components/     # Reusable UI components
├── pages/         # Page components
├── layouts/       # Layout components
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── services/      # Business logic and API services
├── utils/         # Utility functions and helpers
└── assets/        # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd career-ai-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Pages

- **Landing** (`/`) - Introduction and feature overview
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Dashboard** (`/dashboard`) - User overview and quick actions
- **Profile** (`/profile`) - Manage personal information
- **Resume Upload** (`/resume-upload`) - Upload and analyze resumes
- **Career Questionnaire** (`/questionnaire`) - Career assessment
- **AI Recommendations** (`/recommendations`) - View career suggestions
- **Job Search** (`/job-search`) - Search and filter jobs

## API Integration

The application is designed to work with a backend API. Configure the API URL in the environment variables. The API client includes:

- Automatic authentication token handling
- Request/response interceptors
- Error handling
- Type-safe API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
