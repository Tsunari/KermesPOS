# Changelog

All notable changes to the Kermes project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 23-05-2025
### Kermes POS
#### Added
- Added bulk add feature to add more products at one in import/export page
- New Product Management page to manage products
#### Changed
- Enhanced AppBar animation
- StatisticsPage UI enhancement
- Fix product card alignment of price and menu button


## [1.4.0] - 21-05-2025
### Kermes POS
#### Added
- Make the product grid either responsive or select a fixed amount of cards per line
- Add functionality to delete transaction in the all sales view
- Add total sales view to statistics page
#### Changed
- Huge improvements to UI
- Defautl pageScrollbars to false
- New modern App bar
- New modern Speed Dial
- Enhance transaction display with expandable details and sorting
- Change settings items
- Increase box shadow of total sales accordions for better visibility
- Improvements to auto-translate script


## [1.3.0] - 19-05-2025
### Global
- Title now includes version name --change
- Change release script to also update kermes-web version --change
- Added automatic changelog

### Kermes Web
#### Changed
- Changed icon
- Renamed to Preview
### Kermes Electron
#### Added
- Added print summary functionality
#### Changed
- Changed icon
### Kermes POS
#### Added
- Add support mail function in about section
- Set signers through dialog when generating report
#### Changed
- Use name specified in cart for summary kursName
- Easily access states across files with variableContextProvider
- Display pos version according to package.json
- Changed icon


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
