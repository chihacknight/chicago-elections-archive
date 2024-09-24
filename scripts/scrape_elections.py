from io import BytesIO
import xlrd
from pprint import pprint
import pandas as pd
from aiohttp import ClientSession
from json import dump, load
from asyncio import Semaphore, gather, run
from aiohttp_client_cache import CachedSession, SQLiteBackend
from requests import get
from itertools import dropwhile
from bs4 import BeautifulSoup
import warnings
from multiprocessing import Pool
from os import getenv
import locale
import csv
locale.setlocale( locale.LC_ALL, 'en_US.UTF-8' )

DEBUG = getenv('DEBUG', 1)
print(DEBUG)
SCRAPE_PROCESSES = getenv('SCRAPE_PROCESSES', 6) #my computer has 8 cores
warnings.filterwarnings("error")


def book_pandas(d):
    contest, race, book = d['contest'], d['race'], d['data']
    print(contest, race)
    try:
        workbook: xlrd.Book = xlrd.open_workbook(
            file_contents=book, ignore_workbook_corruption=True
        )
    except xlrd.XLRDError as e:
        print(e)
        return 
    sheet = workbook.sheet_by_index(0)
    rows = sheet.get_rows()
    subtables = []
    for i in range(3):
        next(rows)
    cur_row = next(rows)
    cols = []
    while cur_row:
        ward = cur_row[0].value

        #TODO: unfortunately there's a bug where, for certain races that simply can't be generated e.g. 
        cols = next(rows)
        cols = [col.value if col.value != "%" else cols[i - 1].value + " %" for i, col in enumerate(cols)]
        cur_row = next(rows)
        try:
            while not all(
                [
                    cell.ctype in (xlrd.XL_CELL_EMPTY, xlrd.XL_CELL_BLANK)
                    for cell in cur_row
                ]
            ):
                print(type(cur_row[0].value))
                row = [int(ward.split(' ')[1]),
                       int(cur_row[0].value) if type(cur_row[0].value) is not str else cur_row[0].value , 
                       int(cur_row[1].value) if type(cur_row[1].value) is not str else int(cur_row[1].value.replace(',','')),
                       int(cur_row[2].value) if type(cur_row[2].value) is not str else int(cur_row[2].value.replace(',','')),
                       float(cur_row[3].value[:-1])]
                subtables.append(row)
                cur_row = next(rows)
        except StopIteration:
            pass
        cur_row = next(rows, None)
    cols = ['Ward', *cols]
    with open(f'../output/{race}_{contest}.csv', 'w') as ofp:
        writer = csv.writer(ofp)
        writer.writerow(cols)
        writer.writerows(subtables)
    return 
        

async def fetch_contest_data(
    race: int, contest: int, cs: ClientSession, elec_data: dict, sem: Semaphore
):
    await sem.acquire()
    try:
        resp = await cs.get(
            f"https://chicagoelections.gov/elections/results/{race}/download?contest={contest}&ward=&precinct="
        )
        resp.raise_for_status()
        # This happens for some contests e.g. https://chicagoelections.gov/elections/results/7/download?contest=334&ward=&precinct=
        if resp.content_type != "application/vnd.ms-excel":
            raise RuntimeError(f"race {race} contest {contest} did not return an Excel spreadsheet")
        return {'contest': contest,
                'race': race,
                'data': await resp.content.read()}
    except Exception as e:
        print(e, race, contest)
        return None
    finally:
        sem.release()


async def fetch_races():
    resp = get("https://chicagoelections.gov/elections/results")
    soup = BeautifulSoup(resp, "lxml")
    races = [
        dropwhile(lambda c: not c.isnumeric(), link["href"])
        for link in soup
        if link["href"].startswith("/elections/results")
    ]
    return races


async def fetch_contests():
    # <select name="contest"
    raise NotImplementedError


async def main():
    with open("../output/results-metadata.json", "r") as ifp:
        results_metadata: dict = load(ifp)
    pairs = (
        (contest, race)
        for contest, c_info in results_metadata.items()
        for race in c_info["races"]
    )
    if DEBUG == 1:
        pairs = list(pairs)[:1]
        # pprint(pairs)
    contest_data = {}
    sem = Semaphore(10)
    # maybe we can store this sqlite database for fast downloads? 
    async with CachedSession(cache=SQLiteBackend("test_cache")) as cs:
        contest_data = await gather(
            *(fetch_contest_data(*pair, cs, contest_data, sem) for pair in pairs)
        )
    # TODO: Need a more elegant solution for this. Occasionally there are tables where 
    # parts are empty - there's multiple candidates listed as 'No Candidate'
    # e.g. https://chicagoelections.gov/elections/results/240/download?contest=390&ward=&precinct=
    warnings.resetwarnings() 
    contest_data = list(filter(None, contest_data))

    with Pool(6) as p:
        contest_data = p.map(book_pandas, contest_data)
    with open("data.json", "w") as ofp:
        dump(contest_data, ofp, indent=2)


if __name__ == "__main__":
    run(main())
