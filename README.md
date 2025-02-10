# Supabase Security Compliance Scanner

![Supabase Security Scanner](./public/preview.png)

A modern web application that helps you ensure your Supabase projects follow security best practices and compliance standards. Built with Next.js and powered by AI analysis.

## 🚀 Features

- **Real-time Security Scanning**
  - Multi-Factor Authentication (MFA) status check
  - Row Level Security (RLS) verification
  - Point in Time Recovery (PITR) monitoring
  - Beautiful radar animation during scans

- **AI-Powered Analysis**
  - Detailed security assessment
  - Risk categorization (High, Medium, Low)
  - Actionable recommendations
  - Compliance scoring

- **Professional Reporting**
  - Comprehensive PDF reports
  - Visual progress indicators
  - Detailed compliance breakdowns
  - AI insights included

## 🛠️ Tech Stack

- **Frontend**
  - Next.js 14
  - React Bootstrap
  - Font Awesome
  - Custom CSS Modules

- **Backend**
  - Supabase Management API
  - Groq AI for analysis
  - Node-postgres for database checks
  - PDF generation with jsPDF

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 14.x or higher
- npm or yarn
- A Supabase project
- Groq API key for AI analysis

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/supabase-security-scanner.git
   cd supabase-security-scanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your credentials:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔑 Required Credentials

To perform a security scan, you'll need:

1. **Supabase URL**
   - Format: `https://your-project.supabase.co`
   - Found in: Project Settings > API

2. **Service Role Key**
   - Found in: Project Settings > API > Service Role Key
   - Used for: Accessing admin functionalities

3. **Database Password**
   - Found in: Project Settings > Database
   - Used for: RLS checks

4. **Management Token**
   - Found in: Supabase Dashboard > Account > Access Tokens
   - Used for: PITR status checks

## 🔒 Security Best Practices

- All credentials are handled securely and never stored
- SSL/TLS encryption for all API calls
- Secure database connections
- Input validation on both client and server
- Environment variables for sensitive data

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform:
   - Vercel (recommended)
   - Netlify
   - Custom server

## 📁 Project Structure

```
├── components/        # Reusable React components
├── pages/            # Next.js pages and API routes
│   ├── api/         # Backend API endpoints
│   │   ├── scan.js  # Security scanning logic
│   │   ├── chat.js  # AI analysis integration
│   │   └── fix.js   # Auto-fix functionality
│   └── index.js     # Main application page
├── styles/          # CSS modules and global styles
├── public/          # Static assets
└── utils/           # Helper functions and utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.io/) for the amazing platform
- [Groq](https://groq.com/) for AI capabilities
- [Bootstrap](https://getbootstrap.com/) for UI components
- [Font Awesome](https://fontawesome.com/) for icons

## 📸 Screenshots

### Security Scan
![Security Scan](./public/scan.png)

### Compliance Report
![Compliance Report](./public/report.png)

### AI Analysis
![AI Analysis](./public/analysis.png)

---
Built with ❤️ for the Supabase community 