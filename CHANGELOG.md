# Changelog

All notable changes to the Kermes project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 18-05-2025
### Global
- added automatic changelog

### Kermes POS
#### Changed
- changed icon
### Kermes Electron
#### Added
- added print summary functionality
#### Changed
- changed icon
### Kermes Web
#### Changed
- changed icon
- renamed to Preview

## [1.1.0] - 17-05-2025
### Kermes POS
#### Added
- Native printing integration
  - Windows printer support
  - Receipt formatting
  - Print queue management
  - Individual product printing
- Enhanced cart functionality
  - Multiple payment methods
- Statistics and Analytics
  - Total sales tracking
  - Total profit calculation
  - Items sold by product
  - Sales trends and patterns

#### Changed
- UI improvements for better user experience
- Performance optimizations

### Kermes Electron
#### Added
- Enhanced printer integration
  - Direct USB printing
  - Printer status monitoring
  - Print job queue
- System tray integration
- Auto-update functionality

### Kermes Web
- Automated release download button
- Added Screenshots

## [1.0.1] - 16-05-2025
### Kermes POS
#### Fixed
- Native printing dialog not appearing
- Printer connection issues
- UI responsiveness problems
- Default products save functionality

### Kermes Electron
#### Fixed
- Print window creation issues
- Content loading problems
- Print dialog integration

### Kermes Web
- Initalization

## [1.0.0] - 13-05-2025
### Kermes POS
#### Added
- Basic POS functionality
- Product management system
- Cart system implementation
- Basic UI with Material-UI components
- Category support for food and drinks
- Euro currency support
- Product add/edit interface
- Dropdown menu switches
- Numpad 1-12 integration
- Drag and drop functionality for products
- Compact mode (removed category dividers)
- Language/Localization support init
- Dark Mode support and default

#### Fixed
- Dropdown menu single-click issue where products were incorrectly added to cart
- When going out of dropdown menu in single click mode product gets added to cart

### Kermes Electron
#### Added
- Basic Electron app setup
- React app integration
- Basic window management
- Development tools integration
- Initial printer support

[1.0.0]: https://github.com/Tsunari/KermesPOS/releases/tag/v1.0.0
[1.0.1]: https://github.com/Tsunari/KermesPOS/compare/v1.0.0...v1.0.1
[1.1.0]: https://github.com/Tsunari/KermesPOS/compare/v1.0.1...v1.1.0
[1.2.0]: https://github.com/Tsunari/KermesPOS/releases/tag/v1.2.0
[2.0.0]: https://github.com/Tsunari/KermesPOS/releases/tag/v2.0.0 
