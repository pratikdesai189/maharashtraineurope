import urllib.request
import urllib.parse
import json
import ssl

ssl_context = ssl._create_unverified_context()

titles = [
    "File:Colour_lithograph_depicting_a_Ravan_Davan_event_during_Dussehra_celebrations_in_Minto_Park,_Lahore,_by_Achille_Beltrame,_1923.jpg",
    "File:The_Rangoli_of_Lights.jpg",
    "File:Gudipadwagudi.jpg",
    "File:Tilgul_kha_god_god_bola.jpg",
    "File:Pandharpur_2013_Aashad_-_panoramio_(10)_(cropped).jpg",
    "File:Trimbakeshwar_Temple-Nashik-Maharashtra-1.jpg"
]

base_url = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=500&titles="
url = base_url + urllib.parse.quote("|".join(titles))

try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ssl_context) as response:
        data = json.loads(response.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        for page_id, page_info in pages.items():
            title = page_info.get("title")
            imageinfo = page_info.get("imageinfo")
            if imageinfo:
                print(f"{title}: {imageinfo[0].get('thumburl')}")
            else:
                print(f"{title}: No image info found")
except Exception as e:
    print("Error:", e)
