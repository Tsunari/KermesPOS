# Changelog

All notable changes to the Kermes project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-04-20
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

### Kermes Electron
#### Added
- Basic Electron app setup
- React app integration
- Basic window management
- Development tools integration
- Initial printer support

## [1.0.1] - Unreleased
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

## [1.1.0] - Unreleased
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

## [1.2.0] - Planned
### Kermes POS
#### Added
- Inventory management system
  - Stock tracking
  - Low stock alerts
  - Purchase orders
- Reporting system
  - Sales reports
  - Inventory reports
  - Export functionality

#### Changed
- Code optimization
- Performance improvements
- Documentation updates

### Kermes Electron
#### Added
- Offline mode support
- Backup and restore functionality
- System resource monitoring

## [2.0.0] - Future
### Kermes POS
#### Added
- Multi-store support
- User management and permissions
  - Firebase Authentication
  - User accounts
  - Role-based access control
- Cloud synchronization
- Mobile app integration

#### Changed
- Database optimization
- API versioning
- Security enhancements

### Kermes Electron
#### Added
- Multi-window support
- Advanced printer management
- System integration features
- Plugin system

[1.0.0]: https://github.com/yourusername/kermes/releases/tag/v1.0.0
[1.0.1]: https://github.com/yourusername/kermes/releases/tag/v1.0.1
[1.1.0]: https://github.com/yourusername/kermes/releases/tag/v1.1.0
[1.2.0]: https://github.com/yourusername/kermes/releases/tag/v1.2.0
[2.0.0]: https://github.com/yourusername/kermes/releases/tag/v2.0.0 