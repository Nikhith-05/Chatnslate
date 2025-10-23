<div align="center">

# Chatnslate 🌍💬

**Break down language barriers with AI-powered real-time translation**

A sophisticated multilingual chat platform that enables seamless communication across 20+ languages using Google Gemini AI for instant message translation.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://chatnslate.vercel.app)
[![GitHub Issues](https://img.shields.io/github/issues/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/issues)
[![GitHub Stars](https://img.shields.io/github/stars/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/stargazers)
[![License](https://img.shields.io/github/license/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/blob/main/LICENSE)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Tech Stack](#-tech-stack)
- [⚡ Quick Start](#-quick-start)
- [🛠️ Installation](#️-installation)
- [📚 API Documentation](#-api-documentation)
- [🌍 Supported Languages](#-supported-languages)
- [🏗️ Project Structure](#️-project-structure)
- [🔧 Configuration](#-configuration)
- [🚢 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)

## 🎯 Overview

Chatnslate is a next-generation multilingual communication platform designed to eliminate language barriers in real-time conversations. Built with modern web technologies and powered by Google's advanced Gemini 2.5 Flash AI model, it provides instant, accurate translations while maintaining the natural flow of conversation.

### 🎪 Key Highlights

- **Zero-Delay Translation**: Messages are translated instantly as they arrive
- **20+ Language Support**: Comprehensive coverage of major world languages
- **Enterprise-Grade Security**: Row-level security with Supabase
- **Real-time Synchronization**: Live updates across all connected devices
- **Mobile-First Design**: Responsive interface optimized for all screen sizes

## ✨ Features

<table>
<tr>
<td width="50%">

### 🚀 Core Features
- **🌐 AI-Powered Translation**: Leveraging Google Gemini 2.5 Flash for accuracy
- **💬 Real-time Messaging**: WebSocket-based instant communication
- **🔒 Enterprise Security**: Supabase Auth with row-level security
- **🎯 Smart Detection**: Automatic language identification
- **🔄 Auto-Translation**: Seamless conversion to preferred language

</td>
<td width="50%">

### 🎨 User Experience
- **📱 Responsive Design**: Optimized for mobile and desktop
- **� Global Reach**: 20+ supported languages
- **⚡ Lightning Fast**: Sub-second translation speeds
- **🎭 Intuitive Interface**: Clean, modern UI/UX design
- **🔔 Live Updates**: Real-time delivery notifications

</td>
</tr>
</table>

### 🏆 Advanced Capabilities

- **Smart Contact Management**: Easily find and add conversation partners
- **Conversation Persistence**: Full chat history with translation records
- **Language Preferences**: Personalized settings for each user
- **Cross-Platform Compatibility**: Works across all modern browsers
- **Offline Fallback**: Graceful degradation when services are unavailable


## 🚀 Tech Stack

<div align="center">

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.2.4 | Full-stack React framework |
| **Language** | TypeScript | 5.0+ | Type-safe development |
| **Frontend** | React | 19.0+ | Component-based UI |
| **Styling** | Tailwind CSS | 4.1+ | Utility-first CSS framework |
| **UI Components** | Radix UI | Latest | Accessible design system |
| **Backend** | Supabase | Latest | BaaS with PostgreSQL |
| **Database** | PostgreSQL | Latest | Relational database |
| **Real-time** | Supabase Realtime | Latest | WebSocket connections |
| **Authentication** | Supabase Auth | Latest | User management |
| **AI/ML** | Google Gemini | 2.5 Flash | Language translation |
| **Deployment** | Vercel | Latest | Serverless hosting |

</div>

## ⚡ Quick Start

```bash
# Clone and setup in one go
git clone https://github.com/nikhith-05/Chatnslate.git
cd Chatnslate
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## 🛠️ Installation

### 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

<table>
<tr>
<td width="25%"><strong>🟢 Node.js</strong></td>
<td width="75%">Version 18.0.0 or higher (<a href="https://nodejs.org/">Download</a>)</td>
</tr>
<tr>
<td><strong>📦 Package Manager</strong></td>
<td>npm, pnpm, or yarn</td>
</tr>
<tr>
<td><strong>🗄️ Supabase</strong></td>
<td>Free account (<a href="https://supabase.com/">Sign up</a>)</td>
</tr>
<tr>
<td><strong>🤖 Google Cloud</strong></td>
<td>Project with Gemini API enabled (<a href="https://console.cloud.google.com/">Setup</a>)</td>
</tr>
</table>

### 1. Clone the repository

```bash
git clone https://github.com/nikhith-05/Chatnslate.git
cd Chatnslate
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_gemini_api_key

# Optional: Development redirect URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/chat
```

### 4. Database Setup

Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor in order:

```sql
-- Run these files in order:
001_create_profiles.sql
002_create_conversations.sql
003_create_messages.sql
004_create_contacts.sql
005_create_triggers.sql
006_enable_realtime.sql
```

### 5. Run the development server

```bash
npm run dev
# or
pnpm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 API Documentation

### Translation API

#### POST `/api/translate`

Translate text or detect language.

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "es",
  "sourceLanguage": "en", // optional
  "action": "translate" // or "detect"
}
```

**Response:**
```json
{
  "translatedText": "Hola, ¿cómo estás?"
}
```

## 🌍 Supported Languages

<div align="center">

### Major World Languages (20+)

<table>
<tr>
<td align="center"><strong>� European</strong></td>
<td align="center"><strong>🌏 Asian</strong></td>
<td align="center"><strong>🌎 Others</strong></td>
</tr>
<tr>
<td>
�🇺🇸 English (en)<br>
🇪🇸 Spanish (es)<br>
🇫🇷 French (fr)<br>
🇩🇪 German (de)<br>
🇮🇹 Italian (it)<br>
🇵🇹 Portuguese (pt)<br>
🇷🇺 Russian (ru)
</td>
<td>
🇯🇵 Japanese (ja)<br>
🇰🇷 Korean (ko)<br>
🇨🇳 Chinese (zh)<br>
🇮🇳 Hindi (hi)<br>
🇮🇳 Bengali (bn)<br>
🇮🇳 Telugu (te)<br>
🇮🇳 Marathi (mr)
</td>
<td>
🇸🇦 Arabic (ar)<br>
🇮🇳 Tamil (ta)<br>
🇮🇳 Gujarati (gu)<br>
🇮🇳 Kannada (kn)<br>
🇮🇳 Malayalam (ml)<br>
🇮🇳 Punjabi (pa)
</td>
</tr>
</table>

*Powered by Google Gemini's advanced language understanding*

</div>

## 🏗️ Project Structure

```
Chatnslate/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   ├── translate/     # Translation endpoints
│   │   └── messages/      # Message management
│   ├── auth/              # Authentication pages
│   ├── chat/              # Main chat interface
│   └── settings/          # User settings
├── components/            # React components
│   ├── chat/             # Chat-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   ├── translation.ts    # Translation utilities
│   └── types.ts          # TypeScript types
├── scripts/              # Database setup scripts
└── styles/               # Global styles
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable Row Level Security (RLS)
3. Run the provided SQL scripts
4. Enable Realtime for the `messages` table
5. Add your Supabase credentials to `.env.local`

### Google Gemini API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Gemini API
3. Create an API key
4. Add the API key to `.env.local`

## 🚢 Deployment

### 🔥 Deploy to Vercel (Recommended)

<details>
<summary><strong>📖 Step-by-step guide</strong></summary>

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "New Project" → Import your GitHub repository
   - Configure project settings

3. **Environment Variables**
   Add the following in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_value
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   SUPABASE_SERVICE_ROLE_KEY=your_value
   GOOGLE_GENERATIVE_AI_API_KEY=your_value
   ```

4. **Deploy**
   ```bash
   # Automatic deployment on push, or use CLI
   npm i -g vercel
   vercel --prod
   ```

</details>

### 🐳 Alternative: Docker Deployment

<details>
<summary><strong>🛠️ Docker setup</strong></summary>

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t chatnslate .
docker run -p 3000:3000 chatnslate
```

</details>

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

<div align="center">

[![Contributors](https://img.shields.io/github/contributors/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/network/members)
[![Pull Requests](https://img.shields.io/github/issues-pr/nikhith-05/Chatnslate?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate/pulls)

</div>

### 🚀 Getting Started

<details>
<summary><strong>📋 Contribution Guidelines</strong></summary>

1. **🍴 Fork the repository**
   ```bash
   gh repo fork nikhith-05/Chatnslate --clone
   ```

2. **🌿 Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **✨ Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **🧪 Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **📝 Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

6. **🚀 Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

</details>

### 🎯 Areas for Contribution

- 🌍 **Language Support**: Add new languages or improve translations
- 🎨 **UI/UX**: Enhance the user interface and experience
- 🚀 **Performance**: Optimize loading times and responsiveness
- 🔧 **Features**: Implement new chat functionalities
- 📚 **Documentation**: Improve guides and API docs
- 🧪 **Testing**: Increase test coverage and reliability

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Google Gemini](https://ai.google.dev/) - Advanced AI for translation
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives

## 📞 Support

<div align="center">

### 💬 Get Help

[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-red?style=for-the-badge&logo=github)](https://github.com/nikhith-05/Chatnslate/issues)
[![Email Support](https://img.shields.io/badge/Email-Support-blue?style=for-the-badge&logo=gmail)](mailto:bochkarnikhith@gmail.com)
[![Discord](https://img.shields.io/badge/Discord-Community-purple?style=for-the-badge&logo=discord)](https://discord.gg/your-server)

</div>

### 🐛 Found a Bug?
1. Check if it's already reported in [Issues](https://github.com/nikhith-05/Chatnslate/issues)
2. If not, [create a new issue](https://github.com/nikhith-05/Chatnslate/issues/new) with:
   - 📝 Clear description of the problem
   - 🔄 Steps to reproduce
   - 🖥️ System information (OS, browser, etc.)
   - 📸 Screenshots if applicable

### 💡 Have a Feature Request?
We'd love to hear your ideas! [Open a feature request](https://github.com/nikhith-05/Chatnslate/issues/new?template=feature_request.md) and let's discuss it.

---

<div align="center">

### 🌟 Show Your Support

If you found this project helpful, please consider:

[![GitHub Stars](https://img.shields.io/badge/⭐_Star_this_repo-yellow?style=for-the-badge)](https://github.com/nikhith-05/Chatnslate)
[![Share on Twitter](https://img.shields.io/badge/Share_on_Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/intent/tweet?text=Check%20out%20ChatNSlate%20-%20AI-powered%20multilingual%20chat!&url=https://github.com/nikhith-05/Chatnslate)

**Made with ❤️ and ☕ by [Bochkar Nikhith](https://github.com/nikhith-05)**

*Breaking language barriers, one conversation at a time* 🌍

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-brightgreen?style=for-the-badge)](https://nikhith.dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/nikhith05)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?style=for-the-badge&logo=github)](https://github.com/nikhith-05)

</div>