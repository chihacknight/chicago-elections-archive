from io import BytesIO
import xlrd
from pprint import pprint
import pandas as pd
from aiohttp import ClientSession
from json import load, dump
from asyncio import run



def book_pandas(book: BytesIO):
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
        print(ward)
        cur_row = next(rows)
        sub_table = []
        try:
            while not all([cell.ctype in (xlrd.XL_CELL_EMPTY, xlrd.XL_CELL_BLANK) for cell in cur_row]):
                sub_table.append([cell.value for cell in cur_row])
                cur_row = next(rows)
        except StopIteration:
            pass
        cols = sub_table[0]
        print(sub_table)
        print(cols)
        for i in range(len(cols)):
            if cols[i] == "%":
                cols[i] = f"{cols[i-1]} %"
        subtables[ward] = pd.DataFrame(sub_table[1:], columns=sub_table[0]).set_index('Precinct').to_dict(orient="index")
        cur_row = next(rows, None)
    dump(subtables, open("subtable.json", 'w'))

    return subtables

async def main():

    results_metadata: dict = load(open("../output/results-metadata.json", "r"))
    pairs = [(contest, race) for contest, c_info in results_metadata.items() for race in c_info["races"]]
    #print(len(pairs))
    #async with ClientSession() as cs:
    #    async with cs.get("https://chicagoelections.gov/elections/results/156/download?contest=15&ward=&precinct=") as resp:
    #        book_pandas(await resp.content.read())
    book_pandas(open("/home/yash/Downloads/download.xls", "rb").read())

if __name__ == "__main__":
    run(main())
