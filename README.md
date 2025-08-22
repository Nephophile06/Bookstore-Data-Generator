
# 📚 Bookstore Data Generator

A full-stack demo app for generating and browsing **fake bookstore data** with a React frontend and Express backend.

## Features

-   Infinite scrolling book list with expandable details
    
-   Adjustable parameters: language, seed, avg. likes & reviews
    
-   Export data to CSV
    
-   Fake book covers generated dynamically
    
-   Multi-language support (English, Germany, Japanese)
    
-   Offline-ready (PWA support)
    

##  Project Structure

-   **server.js** → Express backend (API + static frontend)
    
-   **frontend/** → React app
    
    -   `src/App.js` → Main component
        
    -   `src/App.css` → Styling
        
    -   `src/serviceWorkerRegistration.js` → Service worker setup
        
    -   `src/service-worker.js` → Custom Workbox worker
        
    -   `public/` → Static assets
        

##  Getting Started

### Prerequisites

-   Node.js v16+
    
-   npm
    

### Installation

```sh
git clone <your-repo-url>
cd task5
npm install
npm run build

```

### Run App

```sh
npm start

```

App runs at [http://localhost:4000](http://localhost:4000/)

### Development

-   Frontend only:
    
    ```sh
    cd frontend && npm start
    
    ```
    
-   Backend only:
    
    ```sh
    npm run dev
    
    ```
    

##  API Endpoints

-   `GET /locales` → Supported locales
    
-   `GET /books` → Paginated fake book data
    
-   `GET /cover` → Generated book cover
