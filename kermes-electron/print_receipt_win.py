import sys
import json
import win32print
import win32ui
from datetime import datetime
import usb.core

# This can be set from Electron via an environment variable or config file
KERMES_NAME = sys.argv[1] if len(sys.argv) > 1 else "Münih Fatih Kermes"

def main():
    cart = json.load(sys.stdin)
    printer_name = win32print.GetDefaultPrinter()
    hprinter = win32print.OpenPrinter(printer_name)
    hdc = win32ui.CreateDC()
    hdc.CreatePrinterDC(printer_name)
    hdc.StartDoc(KERMES_NAME + " Fişi")
    hdc.StartPage()

    y = 0
    line_height = 40
    x_left = 100
    x_right = 500
    x_amount = 400
    # Header
    hdc.SetTextColor(0x000000)
    hdc.SetBkMode(1)  # Transparent
    hdc.TextOut(x_left, y, KERMES_NAME.encode('latin-1', 'replace').decode('latin-1'))
    y += line_height
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    hdc.TextOut(x_left, y, f"Tarih: {now}")
    y += line_height
    hdc.TextOut(x_left, y, "--------------------------")
    y += line_height

    # Items
    for item in cart["items"]:
        # Make product name bold and bigger by printing it twice (simulated bold) and with extra spacing
        try:
            font_bold = win32ui.CreateFont({
                'name': 'Arial',
                'height': 36,  # Larger font size
                'weight': 700  # Bold
            })
            hdc.SelectObject(font_bold)
        except Exception:
            pass
        hdc.TextOut(x_left, y, f"Ürün: {item['name']}")
        y += line_height
        # Reset font to normal for the rest
        try:
            font_normal = win32ui.CreateFont({
                'name': 'Arial',
                'height': 24,
                'weight': 400
            })
            hdc.SelectObject(font_normal)
        except Exception:
            pass
        hdc.TextOut(x_amount, y - line_height, f"Adet: {item['quantity']}")
        hdc.TextOut(x_left, y, f"Fiyat: {item['price']:.2f} €")
        y += line_height
        hdc.TextOut(x_left, y, f"Tarih: {now}")
        y += line_height

    # Total
    hdc.TextOut(x_left, y, f"Toplam: {cart['total']:.2f} €")
    y += line_height
    hdc.TextOut(x_left, y, "Teşekkürler!")
    y += line_height

    hdc.EndPage()
    hdc.EndDoc()
    hdc.DeleteDC()
    win32print.ClosePrinter(hprinter)

def escpos():
    cart = json.load(sys.stdin)
    # Update these IDs for your printer (use lsusb or Windows Device Manager)
    p = Usb(0x0519, 0x2013, 0, 0x81, 0x02)  # Example for Star TSP100

    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    for item in cart["items"]:
        p.set(align='center', width=2, height=2)
        p.text(KERMES_NAME + "\n")
        p.set(align='left', width=1, height=1)
        p.text(f"Tarih: {now}\n")
        p.text("--------------------------\n")
        p.text(f"Ürün: {item['name']}\n")
        p.text(f"Adet: {item['quantity']}\n")
        p.text(f"Fiyat: {item['price']:.2f} €\n")
        p.text("--------------------------\n")
        p.cut()  # Real cut after each item

    # Print total and thanks at the end
    p.set(align='left', width=1, height=1)
    p.text(f"Toplam: {cart['total']:.2f} €\n")
    p.text("Teşekkürler!\n")
    p.cut()

def list_usb_printers():
    devices = usb.core.find(find_all=True)
    for dev in devices:
        try:
            manufacturer = usb.util.get_string(dev, dev.iManufacturer)
            product = usb.util.get_string(dev, dev.iProduct)
        except Exception:
            manufacturer = product = "Unknown"
        print(f"VID: {hex(dev.idVendor)}, PID: {hex(dev.idProduct)}, Manufacturer: {manufacturer}, Product: {product}")

if __name__ == '__main__':
    main()