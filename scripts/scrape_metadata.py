from asyncio import gather, run
import json
from bs4 import BeautifulSoup
from aiohttp_client_cache import CachedSession, SQLiteBackend
from asyncio import Semaphore
from typing import List

# Without something in these headers, aiohttp runs afoul of CloudFlare.
headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Priority": "u=0, i",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
}


async def fetch_races(cs: CachedSession) -> List[str]:
    resp = await cs.get(
        "https://chicagoelections.gov/elections/results", headers=headers
    )

    soup = BeautifulSoup(await resp.text(), "lxml")
    races = [
            (link["href"].split("/")[-1], link.text.rstrip())
        for link in soup.find_all("a", href=True)
        if link["href"].startswith("/elections/results/")
    ]
    return races


async def fetch_metadata(cs: CachedSession, sem: Semaphore, race_id: str, race_text: str) -> List[str]:
    async with sem:
        url = f"https://chicagoelections.gov/elections/results/{race_id}" 
        resp = await cs.get(
            url, headers=headers
        )
    text = await resp.text()
    soup = BeautifulSoup(text, "lxml")
    dropdown = soup.find("select", attrs={"id": "edit-contest"})
    contests = {descendent["value"]: descendent.text.rstrip() for descendent in dropdown}
    
    label_date_split = race_text.rfind(' ') 
    metadata = {
        "races": contests,
        "date": race_text[label_date_split+1:],
        "year": int(race_text[:4]),
        "label": race_text[:label_date_split:].rstrip(" -").replace("Cong ", "Congressional ")
    }

    if "primary" in metadata["label"].lower():
        label: str = metadata["label"]
        split = label.split(" ")
        # Personally this is kind of stinky because of how inflexible it is but I suppose it;s a
        # reflection on our political system that I don't think we'd ever need to change this.
        split[-1] = {
            "d": "Democratic",
            "r": "Republican",
            "n": "Non-Partisan",
            "g": "Green",
            "l": "Libertarian",
            "o": "Other"
        }[split[-1][0].lower()]
        metadata["label"] = " ".join(split)
    
    date = metadata["date"].split("/")
    date[2] = str(metadata["year"])
    date[0], date[1] = date[0].rjust(2, "0"), date[1].rjust(2,"0")
    metadata["date"] = "/".join(date)
    
    return metadata


async def main():
    sem = Semaphore(6)
    async with CachedSession(cache=SQLiteBackend("test_cache")) as cs:
        races = await fetch_races(cs)
        contests = await gather(*[fetch_metadata(cs, sem, race[0], race[1]) for race in races])
    race_contest_map = dict(zip(map(lambda r: r[0], races), contests))
    json.dump(race_contest_map, open("output/results-metadata.json", "w"), indent=2)


if __name__ == "__main__":
    run(main())
