# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5e541068-4bfc-4bfb-abfb-6e125fa90b8f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5e541068-4bfc-4bfb-abfb-6e125fa90b8f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5e541068-4bfc-4bfb-abfb-6e125fa90b8f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Fluvio Collaborative Features Setup

To set up and use the collaborative features with Fluvio in WSL Ubuntu:

## Prerequisites

1. Windows Subsystem for Linux (WSL) with Ubuntu installed
2. Fluvio installed in your WSL Ubuntu environment

## Installation Steps for Fluvio in WSL

1. Open a WSL terminal (Ubuntu)
2. Install Fluvio CLI:
   ```bash
   curl -fsS https://packages.fluvio.io/v1/install.sh | bash
   ```
3. Add Fluvio to your PATH:
   ```bash
   export PATH="$HOME/.fluvio/bin:$PATH"
   ```
   Add this line to your `.bashrc` or `.zshrc` for permanent setup.
4. Start a local Fluvio cluster:
   ```bash
   fluvio cluster start
   ```

## Running the Collaborative Server

From your Windows environment, run:

```bash
npm run server:collab
```

This script will:
1. Detect your WSL environment
2. Find the WSL IP address
3. Update the `.env` file with the correct WSL IP
4. Start Fluvio if it's not already running
5. Start the collaborative server with Fluvio integration

## Troubleshooting

If you encounter issues:

1. Make sure Fluvio is installed in WSL:
   ```bash
   wsl which fluvio
   ```

2. Check if Fluvio cluster is running:
   ```bash
   wsl fluvio cluster status
   ```

3. Manually start Fluvio if needed:
   ```bash
   wsl fluvio cluster start
   ```

4. Get your WSL IP address:
   ```bash
   wsl hostname -I
   ```
   The first IP address should be used for `VITE_FLUVIO_WSL_IP` in your `.env` file.
