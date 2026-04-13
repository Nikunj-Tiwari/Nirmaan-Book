# NirmanBook Custom Wardrobe Configurator

A comprehensive, rule-based web application tailored for designing, modularizing, and pricing custom wardrobes dynamically. Built specifically with modern web technologies to handle physical design constraints, automatic Bill of Materials (BOM) generation, structural 2D visualizations, and seamless quoting.

---

## ⚡ Features

- **Interactive Configuration Steps:** Streamlined wizard for selecting dimensions and constraints.
- **Rule-Based Design Engine:** Validates available width, calculates correct door sizes, and dynamically enforces layout integrity.
- **2D Visualizations:** Offers a live preview of the structural elements rendering panels, hanging spaces, drawers, and shelving.
- **Dynamic Real-Time Pricing:** Synchronizes material layers, cabinet depths, specific handles, lighting, and internal accessories instantly.
- **PDF & JSON Exports:** Generate professional paper layouts directly from the DOM using custom Print media pipelines or export raw structured JSON configuration data.
- **Firebase Intregration:** Basic authorization shell enabled through Google Firebase backend bindings.

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (CSS Modules / CSS Vars with pure `.index.css` structure)
- **State Management**: React Context API
- **Routing**: React Router DOM (v7)
- **Exports**: jsPDF & html2canvas
- **Backend / Auth**: Firebase (v12)

## 🚀 Quick Setup

This project uses `npm`.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/nirmanbook-wardrobe-configurator.git
   cd nirmanbook-wardrobe-configurator
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Duplicate the provided layout structure for Firebase in standard form.

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` and fill it with your Firebase config._

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## 👩‍💻 Scripts

- `npm run dev` – Launch the Vite dev server locally.
- `npm run build` – Create an optimized production build in `/dist`.
- `npm run lint` – Run ESLint across configurations checking style guides.
- `npm run format` – Run standard uniform prettier format fixes.

## 📄 License

Distributed under the [MIT License](LICENSE).
