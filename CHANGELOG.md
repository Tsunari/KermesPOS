# Changelog

All notable changes to the Kermes project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.23.3] - 03-06-2026
### Kermes POS
#### Changed
- Test frontend updater


## [1.23.2] - 03-06-2026
### Kermes Electron
#### Fixed
- Fix path --fix


## [1.23.1] - 03-06-2026


## [1.23.0] - 03-06-2026
### Kermes Electron
#### Added
- Enhance update functionality


## [1.22.0] - 03-06-2026
### Kermes POS
#### Changed
- Persist session dropdown
- Stat page time preset with sessions and comparison analysis changes
- Cart UI redesign
#### Fixed
- Fix guide card always showing --fix


## [1.21.0] - 02-06-2026
### Kermes POS
#### Changed
- Cart UI redesign
#### Fixed
- Fix guide card always showing --fix


## [1.20.2] - 02-06-2026
### Kermes POS
#### Fixed
- Fix guide card always showing --fix


## [1.20.1] - 29-05-2026
### Kermes POS
#### Fixed
- Online orders redundant flag fix --fix


## [1.20.0] - 29-05-2026
### Kermes POS
#### Added
- Implement unified pos backup service coordinating localstorage and indexeddb
- Add raw database overwrite methods to transaction and session services
- Add system backup translation keys to localization files
- Currency functionality synced with menu  --menu
- Settable currency setting introduced
#### Changed
- Redesign import export manager with full system database time machine tabs
- Big statistics page redesign
- Centralized currency setting   --admin
- Change calculator UI redesign
- Settings page UI glowup
- Import/export glowup
- Sessions page glowup
#### Fixed
- Cleanup old online orders flag --fix  --admin --menu
- Json import InStock case fix --fix


## [1.19.0] - 26-05-2026
### Global
- Online order problems fix  -menu
- Replace useParams with usePathname for tenant ID retrieval  --menu
- Remove unneded auth  --menu
- Bankl and paypal info dynamic  --menu --admin
- Dynamic page context and administrative dashboard for tenant management  --menu
- Reset cart and clear editing locks when starting a new order  --menu
- Implement clean minimalist status screens and timeouts for finished and cancelled tickets  --menu
- Relocate routing endpoints into tenant dynamic folder segment  --menu
- Integrate real-time interactive active kermeses portal landing page  --menu
- Implement namespace prefixes for storage keys to isolate cart sessions  --menu
- Create dynamic active kermes provider react context  --menu
- Add role-based firestore rules restricting tenant administrators --feat
- Secure settings toggle sync and lock dashboard scope to tenant identifiers  --admin
- Implement provisioner forms supporting tenant admins and register accounts  --admin
- Replace asset folder text input with interactive directory dropdown  --admin
- Render pulsing unsaved changes status badge next to editor headers  --admin
- Design floating glassmorphic unsaved changes action bar at viewport bottom  --admin
- Implement revert edits action to restore draft to firestore originals  --admin
- Append viewport entrance slide-up keyframes to main styling utilities  --admin

### Kermes POS
#### Changed
- [Care] remove pos listening
- Standard product descriptions deleted


## [1.18.0] - 25-05-2026
### Global
- Kermes menu small UI adjustments  --menu
- Create language context and hooks for multilingual support  --menu
- Implement order page with real-time updates and order management  --menu
- Add German localization for menu app  --menu
- Add English localization for menu app  --menu
- Add Turkish localization for menu app  --menu

### Kermes POS
#### Added
- Add autosync functionality for products to Firestore


## [1.17.0] - 25-05-2026
### Global
- Document custom commit slash command in AGENTS.md --chore

### Kermes POS
#### Added
- Implement recentOrdersDockPosition state and settings in VariableContext
- Integrate RecentOrdersPanel left and right dock positions and transitions in App
- Add dynamic product card column subtraction offset by 3 and horizontal scrollbar fallback to ProductGrid
- Render warning notice banner at the top of ProductGrid when past order editing is active
- Intercept product card clicks in App to add directly to edit items when editing transaction is active
- Create RecentOrdersPanel with quick reprint, session-free querying, pagination load more, and synced=false updates reset
- Add translations for dockLeft, dockRight, loadMore, and editing warnings to localization files
#### Changed
- Light mode changes
- Speeddial to dock
- Calculator UI change
- Ui changes
#### Fixed
- Fix opacity bug when using keybind --fix


## [1.16.0] - 25-05-2026
### Kermes POS
#### Changed
- Major UI changes


## [1.15.0] - 25-05-2026
### Global
- Suspend/activate account toggles and search/filters in management  --admin
- Simplified session locks and permanent completion actions  --admin
- Global eslint warning overrides for unused elements and explicit any --change
- Active kermes name toggle  --menu --admin

### Kermes POS
#### Added
- Payment method functionality
- Implement product management with drag-and-drop ordering and bulk visibility toggling
#### Changed
- Distinguish lock and complete sync errors and prompt local complete
- Persist sync page session selection dropdown
#### Fixed
- Timezone-safe calendar date splits for sessions and transactions --fix


## [1.14.0] - 24-05-2026
### Global
- Refactoring and loading  --menu
- New kermes from admin panel  --admin
- Dynamic menu creation  --menu

### Kermes POS
#### Added
- Syncing of sales   --admin


## [1.13.2] - 19-05-2026
### Kermes POS
#### Changed
- Update enhancements


## [1.13.1] - 19-05-2026
### Kermes POS
#### Changed
- Add alltime and year time ranges


## [1.13.0] - 19-05-2026
### Kermes POS
#### Added
- Hotkey functionality
#### Fixed
- Update enhancements --fix
- Update progress fix --fix


## [1.12.1] - 19-05-2026


## [1.12.0] - 01-01-2026
### Kermes POS
#### Added
- Stats analyze session link
- Session managmenent
- Price change tracking
#### Fixed
- Fix revenue calc issue for product price change --fix


## [1.11.4] - 01-01-2026
### Global
- Update fixes



## [1.11.3] - 01-01-2026
### Global
- Fix update files not being in scope



## [1.11.2] - 01-01-2026
### Global
- Fixed changelog and script



## [1.11.1] - 01-01-2026
### Kermes POS
#### Fixed
- Enhanced update functionality --fix --pos


## [1.11.0] - 01-01-2026
### Kermes POS
#### Added
- Product analysis section
#### Fixed
- Persisten order with sync --fix --pos

## [1.10.0] - 01-11-2025


## [1.9.0] - 31-10-2025
### Kermes POS
#### Added
- Added updater
### Kermes Electron
#### Added
- Added updater


## [1.8.0] - 31-10-2025
### Kermes POS
#### Added
- Added visibility toggle to product management page
#### Changed
- Tooltips for shortcuts in productManagementPage
### Kermes Web
#### Added
- Todo and changelog


## [1.7.0] - 31-08-2025
### Kermes POS
#### Added
- Configurable functionality to separately add products to cart

### Kermes Web
#### Added
- Todo and changelog


## [1.6.3] - 25-05-2025
### Kermes POS
#### Changed
- Separate textfields for receipt name and summary name each


## [1.6.2] - 25-05-2025


## [1.6.1] - 25-05-2025
### Kermes POS
#### Changed
- Make it possible to edit a transaction


## [1.6.0] - 24-05-2025
### Kermes POS
#### Added
- New changeCalculator in cart


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
