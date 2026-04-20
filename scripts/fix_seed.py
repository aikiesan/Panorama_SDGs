import re
f = open('data/seed/seed.sql', 'r', encoding='utf-8')
t = f.read()
f.close()
t = re.sub(r'COPY public\.spatial_ref_sys.*?^\\\.', '', t, flags=re.DOTALL | re.MULTILINE)
f = open('data/seed/seed.sql', 'w', encoding='utf-8')
f.write(t)
f.close()
print('Done')
