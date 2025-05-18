import sys
import json
import win32print
import win32ui
from datetime import datetime
import usb.core
import signal
import os
import io
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

# This can be set from Electron via an environment variable or config file
# KERMES_NAME = sys.argv[1] + " Kermes" if len(sys.argv) > 1 else "Münih Fatih Kermes"
KERMES_NAME = sys.argv[1] if len(sys.argv) > 1 else "Münih Fatih Kermes"

def handle_sigterm(signum, frame):
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)

# Clear all jobs for the given printer
def clear_print_queue(printer_name):
    hprinter = win32print.OpenPrinter(printer_name)
    try:
        jobs = win32print.EnumJobs(hprinter, 0, -1, 1)
        for job in jobs:
            try:
                win32print.SetJob(hprinter, job['JobId'], 0, None, 3)  # 3 = JOB_CONTROL_DELETE
            except Exception as e:
                print(f'Error deleting job {job["JobId"]}: {e}', file=sys.stderr)
    finally:
        win32print.ClosePrinter(hprinter)

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
    try:
        font_bold_header = win32ui.CreateFont({
            'name': 'Arial',
            'height': 40,  # Even larger for header
            'weight': 900  # Extra bold
        })
        hdc.SelectObject(font_bold_header)
    except Exception:
        pass
    hdc.TextOut(x_left, y, KERMES_NAME)
    y += line_height
    # Reset font to normal for the rest of the header
    try:
        font_normal = win32ui.CreateFont({
            'name': 'Arial',
            'height': 24,
            'weight': 400
        })
        hdc.SelectObject(font_normal)
    except Exception:
        pass
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    hdc.TextOut(x_left, y, f"Tarih: {now}")
    y += line_height
    hdc.TextOut(x_left, y, "------------------------------------------")
    y += line_height

    # Items
    for item in cart["items"]:
        # Make product name bold and bigger
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
        # Print Fiyat (normal) and Adet (bold) on the same line
        # First print Fiyat with normal font
        try:
            font_normal = win32ui.CreateFont({
                'name': 'Arial',
                'height': 24,
                'weight': 400
            })
            hdc.SelectObject(font_normal)
        except Exception:
            pass
        fiyat_text = f"Fiyat: {item['price']:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
        hdc.TextOut(x_left, y, fiyat_text)
        # Now print Adet with bold font, positioned after Fiyat
        try:
            font_bold_adet = win32ui.CreateFont({
                'name': 'Arial',
                'height': 32,
                'weight': 700
            })
            hdc.SelectObject(font_bold_adet)
        except Exception:
            pass
        # Calculate x position for Adet (after Fiyat)
        adet_x = x_left + 320  # Adjust this value for spacing as needed
        adet_text = f"Adet: {item['quantity']}"
        hdc.TextOut(adet_x, y, adet_text)
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

    # Total
    hdc.TextOut(x_left, y, f"Toplam: {cart['total']:.2f} €".replace(",", "X").replace(".", ",").replace("X", "."))
    y += line_height
    hdc.TextOut(x_left, y, "Afiyet olsun! | Guten Appetit!")
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
    # If called with --clear-queue, clear and exit
    if '--clear-queue' in sys.argv:
        printer_name = win32print.GetDefaultPrinter()
        clear_print_queue(printer_name)
        print('Print queue cleared.')
        sys.exit(0)
    # Or if CLEAR_QUEUE env var is set
    if os.environ.get('CLEAR_QUEUE') == '1':
        printer_name = win32print.GetDefaultPrinter()
        clear_print_queue(printer_name)
        print('Print queue cleared.')
        sys.exit(0)
    main()