# TSP100III Series Printer Integration Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Printer Setup](#printer-setup)
3. [Software Configuration](#software-configuration)
4. [Printing Features](#printing-features)
5. [Troubleshooting](#troubleshooting)
6. [Technical Specifications](#technical-specifications)

## Introduction

The TSP100III Series is a high-performance thermal receipt printer designed for POS (Point of Sale) applications. This manual provides instructions for integrating the TSP100III with the Kermes POS system.

### Key Features
- High-speed printing (250mm/sec)
- 203 DPI resolution
- USB, Serial, and Ethernet connectivity options
- Auto-cutter
- Paper width options: 58mm, 72mm, 80mm, 112mm
- ESC/POS command support

## Printer Setup

### Physical Setup
1. Unpack the printer and remove all protective materials
2. Connect the power adapter to the printer and plug it into a power outlet
3. Connect the printer to your computer using one of the following methods:
   - USB: Connect the USB cable to the printer and your computer
   - Serial: Connect the RS-232 cable to the printer and your computer
   - Ethernet: Connect the Ethernet cable to the printer and your network

### Driver Installation
1. Download the appropriate driver for your operating system from the Star Micronics website
2. Run the installer and follow the on-screen instructions
3. For Windows:
   - Open Device Manager
   - Check if the printer appears under "Ports (COM & LPT)" or "Printers"
   - If it appears with a yellow exclamation mark, right-click and select "Update Driver"

## Software Configuration

### Printer Settings in Kermes POS
1. Open the Kermes POS application
2. Click on the "Settings" icon in the cart view
3. Configure the following settings:
   - **Printer Name**: Select your TSP100III from the dropdown list
   - **Paper Width**: Select the appropriate paper width (58mm, 72mm, 80mm, or 112mm)
   - **Font Size**: Adjust the font size (8-16pt)
   - **Bold Text**: Toggle bold text on/off

### ESC/POS Commands
The Kermes POS system uses ESC/POS commands to control the printer. These commands are handled automatically by the printer service, but you can customize them if needed:

- `ESC @`: Initialize printer
- `ESC E 1`: Bold on
- `ESC E 0`: Bold off
- `ESC a 0`: Left alignment
- `ESC a 1`: Center alignment
- `ESC a 2`: Right alignment
- `GS ! 0`: Normal font size
- `GS ! 11`: Large font size
- `GS ! 22`: Extra large font size
- `GS V 41 0`: Cut paper

## Printing Features

### Individual Item Printing
1. In the cart view, each item has a print icon
2. Click the print icon to print a receipt for that specific item
3. The receipt will include:
   - Item name
   - Category
   - Quantity
   - Price per item
   - Total price for the item

### Cart Printing Options
1. Click the print icon in the cart header to open the print menu
2. Select one of the following options:
   - **Print Entire Cart**: Prints a complete receipt with all items and the total
   - **Print Each Item Separately**: Prints individual receipts for each item in the cart

### Receipt Format
The receipts are formatted with:
- Header with business name and date/time
- Item details (name, category, quantity, price)
- Separator lines between items
- Total amount at the bottom
- Thank you message
- Automatic paper cutting

## Troubleshooting

### Common Issues and Solutions

#### Printer Not Responding
- Check if the printer is powered on
- Verify the connection cable is properly connected
- Restart the printer and the application
- Check if the correct printer is selected in the settings

#### Paper Jams
- Turn off the printer
- Open the paper cover
- Remove any jammed paper
- Close the cover and turn the printer back on

#### Poor Print Quality
- Check if the paper is properly loaded
- Clean the print head using the cleaning utility
- Replace the paper roll if it's running low

#### Incorrect Paper Width
- Verify the paper width setting in the application matches the actual paper width
- Adjust the paper guides to match the paper width

### Error Codes
- **Error 1**: Paper out
- **Error 2**: Cover open
- **Error 3**: Paper jam
- **Error 4**: Communication error

## Technical Specifications

### Physical Specifications
- Dimensions: 140mm (W) x 200mm (D) x 150mm (H)
- Weight: 1.2kg
- Paper width: 58mm, 72mm, 80mm, or 112mm
- Paper thickness: 0.06-0.08mm

### Performance
- Print speed: 250mm/sec
- Resolution: 203 DPI
- Buffer: 4MB

### Connectivity
- USB 2.0
- RS-232 Serial
- Ethernet (10/100Base-T)

### Power Requirements
- Input voltage: AC 100-240V
- Power consumption: 30W (max)
- Standby power: 1.5W

---

For additional support, please contact the Kermes POS support team or refer to the official Star Micronics documentation for the TSP100III Series. 