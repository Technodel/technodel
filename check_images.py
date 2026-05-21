import json, sys, urllib.request, concurrent.futures

data = json.load(sys.stdin)
urls = [p["imageUrl"] for p in data["products"] if p.get("imageUrl")]

def check(url):
    try:
        req = urllib.request.Request(url, method="HEAD")
        resp = urllib.request.urlopen(req, timeout=10)
        return url[:100], resp.status, resp.headers.get("Content-Type", "?")
    except Exception as e:
        return url[:100], "ERROR", str(e)[:60]

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    for result in ex.map(check, urls):
        print(f"{result[0]:100s} | {str(result[1]):5s} | {result[2]}")
