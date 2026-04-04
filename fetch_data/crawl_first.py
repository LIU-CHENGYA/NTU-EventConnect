
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

import pandas as pd

def crawl(driver, list_url):
    driver.get(list_url)
    time.sleep(2)

    ul_Xpath = "/html/body/section/ul"
    ul_list = driver.find_element(By.XPATH, ul_Xpath)

    # 找出裡面所有 li
    li_list = ul_list.find_elements(By.TAG_NAME, "li")

    activities = []
    for i in li_list:
        one_activity = []
        # find text element xpath = /html/body/section/ul/li[2]/a/h2/div
        # find link element xpath = /html/body/section/ul/li[50]/a

        text_element = i.find_element(By.XPATH, "./a/h2/div")
        link_element = i.find_element(By.XPATH, "./a")

        print(link_element.get_attribute("href"))
        print("=====================================")
        print(text_element.text)
        print("=====================================")
    
        one_activity.append(list_url)
        one_activity.append(str(text_element.text))
        one_activity.append(link_element.get_attribute("href"))
        activities.append(one_activity)

    df = pd.DataFrame(activities, columns=["page", "title", "url"])
    return df

def main():
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)

    # 活動場次總表
    list_url1 = "https://my.ntu.edu.tw/actregister/actionList.aspx"
    # 週期活動總表 2026
    list_url2 = "https://my.ntu.edu.tw/actregister/expiredActionList.aspx?year=2026"
    # 過期活動總表 2025
    list_url3 = "https://my.ntu.edu.tw/actregister/expiredActionList.aspx?year=2025"

    
    df1 = crawl(driver, list_url1)
    df2 = crawl(driver, list_url2)
    df3 = crawl(driver, list_url3)

    df = pd.concat([df1, df2, df3], ignore_index=True)

    df.to_csv("term_project/fetch_data/csv/activities.csv", index=False, encoding="utf-8-sig")
    driver.quit()


if __name__ == "__main__":
    main()
