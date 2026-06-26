import re

file_path = "/Users/pratik/VS Code/WebPage/maharashtra/index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to find <img ...> that doesn't have loading="lazy"
# We match <img followed by anything up to >
def add_lazy(match):
    img_tag = match.group(0)
    if 'loading="lazy"' not in img_tag:
        # Insert loading="lazy" after <img 
        return img_tag.replace('<img ', '<img loading="lazy" ')
    return img_tag

new_content = re.sub(r'<img [^>]+>', add_lazy, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Images updated to lazy loading.")
