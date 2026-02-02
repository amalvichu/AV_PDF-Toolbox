# AV_PDF-Toolbox

![Project Logo/Banner Placeholder](https://via.placeholder.com/1200x400?text=AV_PDF-Toolbox+Banner)

A versatile, offline-first web application for all your basic PDF manipulation needs. Built with React and TypeScript, leveraging client-side processing to ensure privacy and speed.

## ✨ Features

-   **Merge PDFs**: Combine multiple PDF documents into a single, cohesive file.
-   **Split PDF**: Extract specific pages or ranges from a PDF to create new documents.
-   **Image to PDF**: Convert various image formats (JPG, PNG) into a single PDF document.
-   **Protect PDF**: Secure your PDF files by adding a password for encryption.
-   **PDF Preview**: Get visual feedback of uploaded PDF files before processing.
-   **Offline Functionality**: All PDF processing happens directly in your browser, ensuring your documents remain private and are never uploaded to a server.
-   **Intuitive UI**: A clean, modern "Bento Grid" dashboard with smooth animations.

## 🛠️ Technologies Used

-   **Frontend**: React.js (with Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **PDF Manipulation**: `pdf-lib` (for core PDF operations)
-   **PDF Encryption**: `@pdfsmaller/pdf-encrypt-lite` (for robust password protection)
-   **PDF Preview**: `pdfjs-dist` (for client-side PDF rendering)
-   **Icons**: `lucide-react`
-   **Animations**: `framer-motion`
-   **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v20 or higher recommended) and npm installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/amalvichu/AV_PDF-Toolbox.git
    cd AV_PDF-Toolbox
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Project Locally

```bash
npm run dev
```
This will start the development server, and you can view the application in your browser, usually at `http://localhost:5173`.

## 📦 Deployment on GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

1.  **Vite Configuration:** The `vite.config.ts` file is set with `base: '/AV_PDF-Toolbox/'`. This is crucial because your project is hosted under a subpath matching your repository name.
2.  **GitHub Actions:** A workflow file (`.github/workflows/deploy.yml`) is provided to automate the build and deployment process on every push to the `main` branch.
3.  **Enable GitHub Pages:** After pushing your changes, navigate to your GitHub repository settings, go to the "Pages" section, and set the "Source" to "GitHub Actions".

Your application will then be available at `https://amalvichu.github.io/AV_PDF-Toolbox/`.

## 💡 Usage

The dashboard presents various PDF tools. Click on any tool card to access its functionality.

-   **Merge**: Drag and drop multiple PDF files, then click "Generate & Download Merged PDF".
-   **Split**: Upload a single PDF, enter the desired page range (e.g., "1-3, 5, 8-10"), then click "Generate & Download Split PDF".
-   **Image to PDF**: Drag and drop JPG or PNG images, then click "Generate & Download PDF".
-   **Protect**: Upload a PDF, enter a password, then click "Protect & Download PDF".

## 📚 Dependencies

All project dependencies are managed in `package.json`. No separate `requirements.txt` is needed for this JavaScript project.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
