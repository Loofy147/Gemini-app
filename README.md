# Gemini CLI Web App

This web application provides a user-friendly interface for the `gemini-cli` and integrates with GitHub.

## Features

- **Gemini CLI Interface:** Execute `gemini-cli` commands from a web-based terminal.
- **Real-time Output:** See the output of your commands in real-time, thanks to WebSockets.
- **GitHub Integration:**
  - View a list of pull requests for a given repository.
  - Trigger GitHub Actions workflows.
  - List available workflows for a repository.
- **Secure Authentication:** Your Gemini API key and GitHub access token are stored securely in a server-side session.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Go (v1.16 or later)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/gemini-app.git
   cd gemini-app
   ```

2. Initialize the `gemini-cli` submodule:
   ```bash
   git submodule update --init --recursive
   ```

3. Install the dependencies. This will also build the `gemini-cli` binary.
   ```bash
   npm install
   ```

4. Create a `.env` file and add your session secret:
   ```bash
   echo "SESSION_SECRET=your-super-secret-key" > .env
   ```

5. Start the application:
   ```bash
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Login:** Enter your Gemini API key and GitHub access token to log in.
2. **Execute Commands:** Use the main terminal to execute `gemini-cli` commands.
3. **GitHub Integration:** Use the provided forms to interact with GitHub.

## Project Structure

- `index.js`: The main entry point for the application.
- `src/`: Contains the modularized source code.
  - `routes.js`: Handles all HTTP routing.
  - `websocket.js`: Manages the WebSocket server and communication.
- `public/`: Contains the static frontend files (HTML, CSS, JS).
- `gemini-cli/`: The `gemini-cli` git submodule.
