# Natural UI Editor

A proof-of-concept tool that enables natural language editing of UI components. Select any element in your app, describe what you want to change, and Gemini AI will generate the code modification.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your Gemini API key to `.env`:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

3. Run the dev server:
```bash
npm run dev
```

## Usage

1. Click **"Edit UI"** button in the bottom right corner
2. Hover over elements to see their source location
3. Click an element to open the editor panel
4. Describe your desired change in natural language
5. Review the AI-generated code diff
6. Copy the new code and apply it to your source file

## How It Works

1. Uses React's `__debugSource` property (injected during development) to map DOM elements to source file locations
2. Fetches the source code and extracts the relevant component
3. Sends your instruction + current code to Gemini AI
4. Displays the modified code as a diff for review

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Google Gemini AI (gemini-2.5-flash-preview-05-20)
