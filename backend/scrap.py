import requests
from bs4 import BeautifulSoup

url = "https://my.ntu.edu.tw/actregister/registerList.aspx"
session = requests.Session()

resp = session.get(url)
soup = BeautifulSoup(resp.text, "html.parser")

events = []
for li in soup.select("ul#ulbox li.m-all"):
    act_id = li.select_one("span.actID").get_text(strip=True)
    act_type = li.select_one("h4 a").get_text(strip=True)
    status = li.select_one("h4 .floatRight").get_text(strip=True)
    title = li.select_one("div.h2box").get_text(strip=True)
    date = li.select_one("strong.actTime").get_text(strip=True)
    slots = li.select_one("p.text strong").get_text(strip=True)  # 場次數
    remaining = li.select_one("span.floatRight strong.highlightedText").get_text(strip=True)

    events.append({
        "id": act_id,
        "type": act_type,
        "status": status,
        "title": title,
        "date": date,
        "sessions": slots,
        "remaining": remaining
    })

for e in events:
    print(e)
