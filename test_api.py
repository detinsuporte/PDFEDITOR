import requests
import os
import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# 1. Create Dummy PDFs
os.makedirs("test_files", exist_ok=True)
def create_dummy(filename, text, pages=1):
    c = canvas.Canvas(filename, pagesize=letter)
    for i in range(pages):
        c.drawString(100, 750, f"{text} - Page {i+1}")
        c.showPage()
    c.save()

create_dummy("test_files/test1.pdf", "Document 1", pages=3)
create_dummy("test_files/test2.pdf", "Document 2", pages=2)

print("Testing API endpoints...")
API_URL = "http://localhost:8000/api"

# Wait for API to be up
for i in range(30):
    try:
        path = "http://localhost:8000/"
        if requests.get(path).status_code == 200:
            print("API Reached!")
            break
    except:
        time.sleep(2)
else:
    print("API not reachable")
    exit(1)

# Test Merge
print("Testing Merge...")
with open("test_files/test1.pdf", "rb") as f1, open("test_files/test2.pdf", "rb") as f2:
    files = [("files", ("test1.pdf", f1, "application/pdf")), 
             ("files", ("test2.pdf", f2, "application/pdf"))]
    resp = requests.post(f"{API_URL}/merge", files=files)
    if resp.status_code == 200:
        with open("test_files/merged_result.pdf", "wb") as out:
            out.write(resp.content)
        print("-> Merge successful.")
    else:
        print("-> Merge failed:", resp.text)

# Test Split (Extract page 2 from test1)
print("Testing Split...")
with open("test_files/test1.pdf", "rb") as f1:
    files = {"file": ("test1.pdf", f1, "application/pdf")}
    data = {"start_page": 2, "end_page": 2} # Extract just page 2
    resp = requests.post(f"{API_URL}/split", files=files, data=data)
    if resp.status_code == 200:
        with open("test_files/split_result.pdf", "wb") as out:
            out.write(resp.content)
        print("-> Split successful.")
    else:
        print("-> Split failed:", resp.text)

# Test Add Text
print("Testing Add Text...")
with open("test_files/test1.pdf", "rb") as f1:
    files = {"file": ("test1.pdf", f1, "application/pdf")}
    data = {"text": "CONFIDENCIAL", "x_pos": 100, "y_pos": 400, "page_number": 1}
    resp = requests.post(f"{API_URL}/add-text", files=files, data=data)
    if resp.status_code == 200:
        with open("test_files/addtext_result.pdf", "wb") as out:
            out.write(resp.content)
        print("-> Add text successful.")
    else:
        print("-> Add text failed:", resp.text)

# Test Compress
print("Testing Compress...")
with open("test_files/test1.pdf", "rb") as f1:
    files = {"file": ("test1.pdf", f1, "application/pdf")}
    resp = requests.post(f"{API_URL}/compress", files=files)
    if resp.status_code == 200:
        with open("test_files/compress_result.pdf", "wb") as out:
            out.write(resp.content)
        print("-> Compress successful.")
    else:
        print("-> Compress failed:", resp.text)

# Test PDF to Word
print("Testing PDF to Word...")
try:
    import pdf2docx
    with open("test_files/test1.pdf", "rb") as f1:
        files = {"file": ("test1.pdf", f1, "application/pdf")}
        resp = requests.post(f"{API_URL}/to-word", files=files)
        if resp.status_code == 200:
            with open("test_files/word_result.docx", "wb") as out:
                out.write(resp.content)
            print("-> PDF to Word successful.")
        else:
            print("-> PDF to Word failed:", resp.text)
except Exception as e:
    print("Cannot test PDF to Word due to local env:", e)

print("All Backend API tests completed.")
