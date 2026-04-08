import sys
try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not installed")
    sys.exit(1)

def extract_text(pdf_path, txt_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + '\n'
        with open(txt_path, 'w', encoding='utf-8') as out_file:
            out_file.write(text)

try:
    extract_text('Nirmanbook_Wardrobe Configurator  (1).pdf', 'configurator_text.txt')
    extract_text('Wardrobe Catalogue_Nirmanbook.pdf', 'catalogue_text.txt')
    print("Extraction successful.")
except Exception as e:
    print(f"Error: {e}")
