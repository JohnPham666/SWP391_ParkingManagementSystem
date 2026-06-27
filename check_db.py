import psycopg2
import os

try:
    conn = psycopg2.connect("dbname=parkingdb user=postgres password=123 host=localhost")
    cur = conn.cursor()
    cur.execute("SELECT sessionid, status, licenseplate FROM parkingsessions ORDER BY sessionid DESC LIMIT 5;")
    rows = cur.fetchall()
    for row in rows:
        print(row)
    cur.close()
    conn.close()
except Exception as e:
    print(e)
