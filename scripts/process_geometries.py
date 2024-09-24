# %%
import pandas as pd
import geopandas as gpd
import os
import requests
import boto3
from dotenv import load_dotenv
import io

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), './.env'))
load_dotenv(ENV_PATH)

ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
BUCKET = os.environ.get('R2_BUCKET')
ACCESS_KEY_ID = os.environ.get('R2_CLIENT_ACCESS_KEY')
ACCESS_KEY_SECRET = os.environ.get('R2_CLIENT_SECRET')

PRECINT_YEARS = [
    1983, 2000, 2003, 2004, 2007, 2008, 2010, 2011, 2012, 2015, 2019, 2021, 2022, 2023
]

CHICAGO_CRS = "EPSG:3435"
DISPLAY_CRS = "EPSG:4326"
TOLERANCE_FT = 100

# %%
def get_geojson_url(year):
    return f'https://chicago-elections-archive.us-east-1.linodeobjects.com/precincts-{year}.geojson'


def handle_legacy_geojson(s3, bucket):
  for year in PRECINT_YEARS:
      url = get_geojson_url(year)
      r = requests.get(url)
      # write to ../input/precincts-{year}.geojson
      with open(f'../output/geojson/precincts-{year}.geojson', 'wb') as f:
          f.write(r.content)

      # s3.upload_file(
      #   f'../input/precincts-{year}.geojson',
      #   bucket, 
      #   f'geojson/precincts-{year}.geojson'
      # )

# %%
if __name__ == '__main__':
    
  s3 = boto3.client('s3',
    endpoint_url = f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com/{BUCKET}',
    aws_access_key_id = ACCESS_KEY_ID,
    aws_secret_access_key = ACCESS_KEY_SECRET
  )
  
  handle_legacy_geojson(s3, BUCKET)

# %%
