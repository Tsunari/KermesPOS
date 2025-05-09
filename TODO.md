# Kermes Development Roadmap

## Version 1.0.0 (Current Release)
### Kermes POS
- [x] Basic POS functionality
- [x] Product management system
- [x] Cart system implementation
- [x] Basic UI with Material-UI components
- [x] Category support for food and drinks
- [x] Euro currency support
- [x] Product add/edit interface
- [x] Dropdown menu switches
- [x] Numpad 1-12 integration
- [x] Drag and drop functionality for products
- [x] Compact mode (removed category dividers)
- [x] Language/Localization support init
- [x] Dark Mode support and default
- [ ] Talebe Yemek Auth
- [ ] Migrate to Next.js React framwork from Create React App (CRA)

### Kermes Electron
- [x] Basic Electron app setup
- [x] React app integration
- [x] Basic window management
- [x] Development tools integration

## Version 1.0.1 (In Progress)
### Kermes POS
#### Fixed
- [ ] Native printing dialog not appearing
- [ ] Printer connection issues
- [ ] UI responsiveness problems
- [ ] Default products save functionality

### Kermes Electron
#### Fixed
- [ ] Print window creation issues
- [ ] Content loading problems
- [ ] Print dialog integration

## Version 1.1.0 (Planned)
### Kermes POS
#### Features
- [ ] Native printing integration
  - [ ] Windows printer support
  - [ ] Receipt formatting
  - [ ] Print queue management
  - [ ] Individual product printing
- [ ] Enhanced cart functionality
  - [ ] Multiple payment methods
- [ ] Statistics and Analytics
  - [ ] Total sales tracking
  - [ ] Total profit calculation
  - [ ] Items sold by product
  - [ ] Sales trends and patterns

#### UI Improvements
- [ ] Language support (Sprache)
- [ ] Receipt layout editor

### Kermes Electron
#### Features
- [ ] Enhanced printer integration
  - [ ] Direct USB printing
  - [ ] Printer status monitoring
  - [ ] Print job queue
- [ ] System tray integration
- [ ] Auto-update functionality

## Version 1.2.0 (Future)
### Kermes POS
#### Features
- [ ] Inventory management system
  - [ ] Stock tracking
  - [ ] Low stock alerts
  - [ ] Purchase orders
- [ ] Reporting system
  - [ ] Sales reports
  - [ ] Inventory reports
  - [ ] Export functionality

#### Technical Debt
- [ ] Code optimization
- [ ] Performance improvements
- [ ] Documentation updates

### Kermes Electron
#### Features
- [ ] Offline mode support
- [ ] Backup and restore functionality
- [ ] System resource monitoring

## Version 2.0.0 (Future)
### Kermes POS
#### Major Features
- [ ] Multi-store support
- [ ] User management and permissions
  - [ ] Firebase Authentication
  - [ ] User accounts
  - [ ] Role-based access control
- [ ] Cloud synchronization
- [ ] Mobile app integration

#### Infrastructure
- [ ] Database optimization
- [ ] API versioning
- [ ] Security enhancements

### Kermes Electron
#### Major Features
- [ ] Multi-window support
- [ ] Advanced printer management
- [ ] System integration features
- [ ] Plugin system

## Versioning Guidelines
- **Major version (X.0.0)**: Incompatible API changes
- **Minor version (0.X.0)**: New features (backward compatible)
- **Patch version (0.0.X)**: Bug fixes (backward compatible)

## Notes
- Each version should include:
  - Updated documentation
  - Changelog
  - Migration guide (if needed)
  - Testing requirements


Bugs:

- [x] When going out of dropdown menu in single click mode product gets added to cart


OSMAN ABI TODO:

- [ ] Sprache
- [ ] Compact (delete category dividers)
- [x] Switches in dropdown
- [x] Numpad 1-12
- [x] Drag and drop for products

VEEEERY LATER Features:

- [ ] Firebase Auth and accounts
- [ ] Editor UI for Receipt layout
