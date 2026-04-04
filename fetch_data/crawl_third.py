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

    # Xpath
    li = [list_url]
    for i in range(1, 25):
        xpath = f"/html/body/article/section/ul/li[{i}]/div"
        item = driver.find_element(By.XPATH, xpath).text
        li.append(str(item))

    columns = ["event_url", "activity_name", "session_name", "session_content", "instructor", "location",
        "session_time", "registration_time", "organizer_unit", "organizer_contact", "registration_type",
        "target_audience", "other_restrictions", "registration_fee", "capacity", "remaining_slots",
        "meal", "civil_servant_hours", "study_hours", "learning_category", "credit", "term",
        "city", "attachment", "note"]
    
    df = pd.DataFrame([li], columns=columns)

    return df


def main():
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)

    base_df = pd.read_csv("term_project/fetch_data/csv/activity_session.csv")
    urls = base_df["event_url"].tolist()

    detail_df_list = []
    for url in urls:
        print(url)
        one_df = crawl(driver, url)
        detail_df_list.append(one_df)
        

    if detail_df_list:
        detail_df = pd.concat(detail_df_list, ignore_index=True)
    else:
        detail_df = pd.DataFrame()

    final_df = base_df.merge(
        detail_df,
        on="event_url",
        how="left",
        suffixes=("_activity_session", "_event_page")
    )

    final_df.to_csv("term_project/fetch_data/csv/events.csv", index=False, encoding="utf-8-sig")
    driver.quit()

if __name__ == "__main__":
    # main()
    df = pd.read_csv("term_project/fetch_data/csv/events.csv")
    df1 = pd.read_csv("term_project/fetch_data/csv/activitiesㄅㄅ.csv")
    # num of rows and columns
    print(df.shape)
    print(df1.shape)
