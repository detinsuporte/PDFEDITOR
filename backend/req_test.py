import requests
import json

url = "http://localhost:8000/api/merge"

# mock files
file_content = b"fake pdf content"
files = [
    ("files", ("test1.pdf", file_content, "application/pdf")),
    ("files", ("test2.pdf", file_content, "application/pdf")),
]

order_mapping = json.dumps([
    {"fileIndex": 0, "pageIndex": 0},
    {"fileIndex": 1, "pageIndex": 0}
])

data = {
    "order_mapping": order_mapping
}

response = requests.post(url, files=files, data=data)

print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.text}")
