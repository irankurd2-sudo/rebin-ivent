# Complete Setup Instructions for Windows

## Step 1: Create Project Folder
```cmd
mkdir C:\InventoryApp
cd C:\InventoryApp
```

## Step 2: Create package.json
Create a file called `package.json` with this content:

```json
{
  "name": "inventory-management-system",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "electron": "electron .",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron-build": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never"
  },
  "dependencies": {
    "date-fns": "^3.6.0",
    "file-saver": "^2.0.5",
    "jspdf": "^3.0.3",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  },
  "main": "electron/main.js",
  "homepage": "./"
}
```

## Step 3: Install Dependencies
```cmd
npm install
```

## Step 4: Create Project Structure
You'll need to create all the folders and files as shown in the project structure.