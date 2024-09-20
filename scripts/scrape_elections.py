from io import BytesIO
import xlrd
from pprint import pprint 
import pandas as pd
from aiohttp import ClientSession
from json import dump, load
from asyncio import gather, run
from aiohttp_client_cache import CachedSession, SQLiteBackend
from requests import get
from itertools import dropwhile
from bs4 import BeautifulSoup
DEBUG = True

def book_pandas(book: BytesIO, race: int, contest: int, elec_data: dict):
    workbook: xlrd.Book = xlrd.open_workbook(file_contents=book, ignore_workbook_corruption=True)
    sheet = workbook.sheet_by_index(0)
    rows = sheet.get_rows()
    total = []
    subtables = {}
    for i in range(3):
        next(rows)
    subtables['Total'] = total
    cur_row = next(rows)
    while cur_row:

        ward = cur_row[0].value
        cur_row = next(rows)
        sub_table = []
        try:
            while not all([cell.ctype in (xlrd.XL_CELL_EMPTY, xlrd.XL_CELL_BLANK) for cell in cur_row]):
                sub_table.append([cell.value for cell in cur_row])
                cur_row = next(rows)
        except StopIteration:
            pass
        cols = sub_table[0]
        cols = [col if col != '%' else cols[i-1] + " %" for i, col in enumerate(cols)]
        for i in range(len(cols)):
            if cols[i] == "%":
                cols[i] = f"{cols[i-1]} %"
        subtables[ward] = pd.DataFrame(sub_table[1:], columns=cols).set_index('Precinct').to_dict(orient="index")
        cur_row = next(rows, None)

    elec_data.setdefault(race, {})[contest] = subtables

async def fetch_contest_data(race: int, contest: int, cs: ClientSession, elec_data: dict):
    print(f"race {race} contest {contest}")
    resp = await cs.get(f"https://chicagoelections.gov/elections/results/{race}/download?contest={contest}&ward=&precinct=")
    book_pandas(await resp.content.read(), race, contest, elec_data)

async def fetch_races():
    resp = get("https://chicagoelections.gov/elections/results")
    soup = BeautifulSoup(resp, "lxml")
    races = [dropwhile(lambda c: not c.isnumeric(), link['href']) for link in soup if link['href'].startswith("/elections/results")]
    return races

async def fetch_contests():
    # <select name="contest"
    raise NotImplementedError

async def main():

    results_metadata: dict = load(open("../output/results-metadata.json", "r"))
    pairs = ((contest, race) for contest, c_info in results_metadata.items() for race in c_info["races"])
    pairs = list(pairs)[:3]
    print(pairs)
    contest_data = {}
    async with CachedSession(cache=SQLiteBackend('test_cache')) as cs:
        await gather(*(fetch_contest_data(*pair, cs, contest_data) for pair in pairs))      
    
    dump(contest_data, open('data.json', 'w'), indent=2)

if __name__ == "__main__":
    run(main())
