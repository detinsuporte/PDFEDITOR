import requests
import json
import os

url = "http://localhost:8000/api/merge"
import fitz

doc = fitz.open()
doc.new_page()
pdf_bytes = doc.write()
doc.close()

files = [
    ("files", ("test1.pdf", pdf_bytes, "application/pdf")),
    ("files", ("test2.pdf", pdf_bytes, "application/pdf")),
]

order_mapping = json.dumps([
    {"fileIndex": 0, "pageIndex": 0},
    {"fileIndex": 1, "pageIndex": 0},
    {"fileIndex": 0, "pageIndex": 1}
])

data = {
    "order_mapping": order_mapping
}

response = requests.post(url, files=files, data=data)

print(f"Status Code: {response.status_code}")
if response.status_code != 200:
    print(f"Response Body: {response.text}")
else:
    print(f"Success! Body len: {len(response.content)}")
