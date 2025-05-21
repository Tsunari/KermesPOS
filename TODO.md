# Kermes POS Development Roadmap

----------------------------

## Version 2.0.0
### Kermes POS
#### Major Features

- [ ] User management and permissions
  - [ ] Firebase Authentication
  - [ ] User accounts
  - [ ] Multi-store support
  - [ ] Role-based access control
  - [ ] Talebe Yemek Auth
- [ ] Cloud synchronization
- [ ] Enhanced cart functionality
  - [ ] Multiple payment methods
- [ ] Inventory management system
  - [ ] Stock tracking
  - [ ] Low stock alerts
  - [ ] Purchase orders
  - [ ] Sales trends and patterns
  - [ ] More statistics with graphs
- [ ] Reporting system
  - [ ] Advanced sales reports
  - [ ] Inventory reports
  - [ ] Enhanced Export functionality
- [ ] Migrate to Next.js React framwork from Create React App (CRA)
- [ ] Setup deepl API auto translate

### Kermes Electron
#### Major Features
- [ ] Multi-window support
- [ ] Advanced printer management
- [ ] Editor UI for Receipt layout
- [ ] System integration features
- [ ] Plugin system
- [ ] System tray integration

### Kermes Web
#### Major Features
- [ ] Documentation of code
- [ ] Documentation of usage

#### Infrastructure
- [ ] Database optimization
- [ ] API versioning
- [ ] Security enhancements

----------------------------

## Version 1.X.0
### Kermes POS
- [ ] Page Caching
- [x] Icon Button in TodaysSales to open popup and view all sales
- [x] Logo in AppBar which opens website
- [ ] Fix example statistics usage in statistics page
- [x] Show items sold when hovered/clicked in accordion
- [ ] Code cleanup and optimization (for example use VariableProvider)
- [ ] Performance improvements
- [x] Sizes of cards editable in UI (or ensure all cards always visible with any screen size)
- [ ] More categories (or "Other" category)
- [ ] Fix reset kurs name is saved without even pressing save
- [ ] Fix new page if summary table is too long

### Kermes Electron
- [x] Offline mode support
- [ ] Enhance update functionality
- [ ] Backup and restore functionality

### Kermes Web
- [ ] Display TODO and CHANGELOG
- [ ] Add Impressum etc
- [ ] Decide how to route (UI)
- [ ] Thumbnails for pages

----------------------------

## Version 1.2.0 (Released)
### Kermes POS
#### Features
- [x] Native printing integration
  - [x] Windows printer support
  - [x] Individual product printing

- [x] Statistics and Analytics
  - [x] Total sales tracking
  - [x] Total profit calculation
  - [x] Items sold by product


### Kermes Electron
#### Features
- [x] Enhanced printer integration
  - [x] Direct USB printing
  - [x] Printer status monitoring
  - [x] Print job queue
- [x] Auto-update functionality

----------------------------

## Version 1.1.0 (Released)
### Kermes POS
#### Fixed
- [x] Native printing dialog not appearing
- [x] Printer connection issues

### Kermes Electron
#### Fixed
- [x] Print window creation issues
- [x] Content loading problems
- [x] Print dialog integration

----------------------------

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
- [x] Switches in dropdown
- [x] Numpad 1-12
- [x] Drag and drop for products
- [x] Language
- [x] Compact (delete category dividers)

### Kermes Electron
- [x] Basic Electron app setup
- [x] React app integration
- [x] Basic window management
- [x] Development tools integration

----------------------------

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
