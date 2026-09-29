# TechAI 🤖

TechAI is an AI-powered technology assistant built with Next.js and Hugging Face.

It helps users ask questions about programming, web development, and technology through a simple and modern chat interface.

## Features

- 🤖 AI-powered chat
- 💬 Chat history
- 🔄 Regenerate AI responses
- 📋 Copy AI responses
- 💻 Code syntax highlighting
- 📋 Copy code blocks
- 🎨 Multiple themes
- 📱 Responsive design
- 💾 Local chat storage
- ⚡ Next.js App Router

## Tech Stack

- Next.js
- React
- JavaScript
- Hugging Face API
- React Markdown
- Remark GFM
- React Syntax Highlighter
- CSS

## Getting Started

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the root of the project:

```env
HF_TOKEN=your_huggingface_token
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

The Hugging Face API token is stored in `.env.local` and is not included in the repository for security reasons.

## Project Structure

```text
ai-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── public/
├── .env.local
├── .gitignore
├── package.json
└── README.md
```

## Author

Bita Karimi

---

Built with Next.js and Hugging Face.