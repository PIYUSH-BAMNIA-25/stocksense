import sys
import os
from supabase import create_client
from datetime import date

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

if not url or not key:
    print('ERROR: Supabase credentials not set')
    sys.exit(1)

client = create_client(url, key)
today = date.today().isoformat()
result = client.table('predictions').select('ticker').eq('date', today).execute()
count = len(result.data)
tickers = [r['ticker'] for r in result.data]
print(f'Predictions saved today: {count}')
print(f'Tickers: {tickers}')
if count < 1:
    print('WARNING: No predictions saved today')
    sys.exit(1)
print('SUCCESS: Predictions verified')
