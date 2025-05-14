<h1 style="display: flex; align-items: center;">
  <a href="https://kermespos.web.app/" style="margin-right: 10px;">
    <img src="/kermes-web/out/pic.png" alt="Kermes POS" width="50" style="filter: invert(1);">
  </a>
  Kermes POS
</h1>

A modern, feature-rich Point of Sale system built with React, TypeScript, and Electron.



## ✨ Features

### Core Features
- 🛍️ Product Management
  - Categories for food and drinks
  - Euro currency support
  - Drag and drop organization
  - Quick add/edit interface
- 🛒 Cart System
  - Real-time updates
  - Multiple payment methods
- 📊 Statistics
  - Sales tracking
  - Profit calculation
  - Product analytics
- 🖨️ Printing
  - Native Windows printing
  - Receipt formatting
  - Print queue management

### Technical Features
- ⚡ Electron-based desktop application
- 🔄 Real-time updates
- 📱 Responsive design
- 🔒 Secure data handling
- 🌐 Offline support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Windows 10 or higher (for printing support)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kermes.git
cd kermes
```

2. Install dependencies:
```bash
# Install POS dependencies
cd kermes-pos
npm install

# Install Electron dependencies
cd ../kermes-electron
npm install
```

3. Start the development server:
```bash
# Start the POS server
cd kermes-pos
npm start

# In a new terminal, start Electron
cd kermes-electron
npm start
```

## 🛠️ Development

### Project Structure
```
kermes/
├── kermes-electron/    # Electron wrapper
│   ├── main.js         # Main process
│   └── preload.js      # Preload script
├── kermes-pos/          # React POS application
│   ├── src/            # Source files
│   ├── public/         # Static files
│   └── server/         # Backend server (deprecated)
└── kermes-web/         # Web application
    ├── src/            # Source files
    └── public/         # Static assets
```

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm electron:dev` - Start Electron in development mode
- `npm electron:build` - Build Electron application

## 📦 Production Build

To create a production build:

```bash
# Build the POS application
cd kermes-pos
npm run build

# Build the Electron application
cd ../kermes-electron
npm run build
```

## 🔧 Configuration

### Printer Setup
1. Install the printer drivers
2. Set printer as standard device
3. Test print functionality

### Database
The application uses IndexedDB for data storage.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the AGPL-3.0 license - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@kermes.com or join our Slack channel.

## 🏗️ Roadmap

See our [TODO](TODO.md) and [CHANGELOG](CHANGELOG.md) for planned features and recent changes.

## 🙏 Acknowledgments

- Material-UI for the beautiful components
- Electron team for the amazing framework
- All contributors who have helped shape this project

---

Made with ❤️ by _