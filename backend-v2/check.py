import requests
from bs4 import BeautifulSoup

url = "https://my.ntu.edu.tw/actregister/registerList.aspx"
session = requests.Session()

resp = session.get(url)
soup = BeautifulSoup(resp.text, "html.parser")

for li in soup.select("ul#ulbox li.m-all"):
    print(li.get_text(strip=True))
