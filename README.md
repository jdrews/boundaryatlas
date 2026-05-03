# BoundaryAtlas

A geopolitical world map explorer featuring thematic country coloring reminiscent of classroom globes. Built with a modern tech stack for high-performance interaction.   
https://jdrews.github.io/boundaryatlas/

## Features
- **Thematic Coloring**: Uses 7-color map logic to ensure adjacent countries have distinct colors, just like we had on classroom globes.
- **Global Context**: Displays major cities and capitals that scale with zoom.
- **Dark/Light Mode**: Toggle between dark and light themes.
- **High Performance**: Powered by MapLibre GL JS for smooth 60fps interaction.

## Technology Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Mapping Engine**: MapLibre GL JS
- **Build Tool**: Vite
- **Icons**: Lucide React

## Data Source
BoundaryAtlas uses the excellent open-source data from **[Natural Earth](https://www.naturalearthdata.com/)**:
- Admin 0 – Countries (1:50m scale)
- Populated Places (1:110m scale)

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Installation
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boundaryatlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

### Building for Production
```bash
npm run build
npm run preview
```

## Deployment

This project is pre-configured for **GitHub Pages** via GitHub Actions.

1. Push your code to the `main` branch of your GitHub repository.
2. Go to **Settings > Pages** in your repository.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The site will automatically build and deploy to `https://<username>.github.io/boundaryatlas/`.
