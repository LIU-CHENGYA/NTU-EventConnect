import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

import pandas as pd

def crawl(driver, list_url):
    driver.get(list_url)
    time.sleep(0.5)

    # 抓基本資料
    parent_url = list_url
    # parent_url, activity_name, activity_content, activity_type, life_learning_type, outside_url, activity_limit
    activity_name_xpath = "/html/body/article/section[1]/ul/li[1]/div"
    activity_content_xpath = "/html/body/article/section[1]/ul/li[2]/div"
    activity_type_xpath = "/html/body/article/section[1]/ul/li[3]/div"
    life_learning_type_xpath = "/html/body/article/section[1]/ul/li[4]/div"
    outside_url_xpath = "/html/body/article/section[1]/ul/li[5]/div"
    activity_limit_xpath = "/html/body/article/section[1]/ul/li[6]/div"

    activity_name = driver.find_element(By.XPATH, activity_name_xpath).text
    activity_content = driver.find_element(By.XPATH, activity_content_xpath).text
    activity_type = driver.find_element(By.XPATH, activity_type_xpath).text
    life_learning_type = driver.find_element(By.XPATH, life_learning_type_xpath).text
    outside_url = driver.find_element(By.XPATH, outside_url_xpath).text
    activity_limit = driver.find_element(By.XPATH, activity_limit_xpath).text
    
    print(activity_name)
    print("=====================================")
    print(activity_content)
    print("=====================================")
    print(activity_type)
    print("=====================================")
    print(life_learning_type)
    print("=====================================")
    print(outside_url)
    print("=====================================") 
    print(activity_limit)
    print("=====================================")

    # 抓詳細的活動場次
    ul_Xpath = "/html/body/article/section[2]/ul"
    ul_list = driver.find_element(By.XPATH, ul_Xpath)
    # 找出裡面所有 li
    li_list = ul_list.find_elements(By.TAG_NAME, "li")

    activities = []
    for i in li_list:
        link_element = i.find_element(By.XPATH, "./a")
        event_url = link_element.get_attribute("href")
        print(event_url)
        print("=====================================")
        activity = [parent_url, str(activity_name), str(activity_content), str(activity_type), str(life_learning_type), str(outside_url), str(activity_limit), str(event_url)]
        activities.append(activity)
    df = pd.DataFrame(activities, columns=["parent_url", "activity_name", "activity_content", "activity_type", "life_learning_type", "outside_url", "activity_limit", "event_url"])
    return df

def main():
    
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)
    
    # read urls from csv
    df = pd.read_csv("term_project/fetch_data/csv/activities.csv")
    urls = df["url"].tolist()

    all_df = pd.DataFrame(columns=["parent_url", "activity_name", "activity_content", "activity_type", "life_learning_type", "outside_url", "activity_limit", "event_url"])
    for url in urls:
        print(url)
        one_df = crawl(driver, url)
        # 將所有 df 合併成一個 df
        all_df = pd.concat([all_df, one_df], ignore_index=True)
    
    all_df.to_csv("term_project/fetch_data/csv/activity_session.csv", index=False, encoding="utf-8-sig")
    driver.quit()

if __name__ == "__main__":
    main()