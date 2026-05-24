
import sqlite3
db=sqlite3.connect("/var/www/technodel.net/new/prisma/dev.db")

gaming_id = "cmpe8m47w0003l3iokktejy3m"
net_id = "cmpe8m4850006l3io54bs28v5"
comp_id = "cmpgypg6k0000l3t7ogyipd2y"
uncat = "cmpfqjd8u0000l3yr2ip88jcq"
monitors_id = "cmpgypg6r0001l3t7cztjavct"

c = db.cursor()

# Move monitors to monitors
c.execute("UPDATE Product SET categoryId=? WHERE categoryId=? AND (title LIKE '%monitor%' OR title LIKE '%display%')", (monitors_id, gaming_id))

# Move switches to networking
c.execute("UPDATE Product SET categoryId=? WHERE categoryId=? AND (title LIKE '%switch%' OR title LIKE '%router%' OR title LIKE '%access point%' OR title LIKE '%ubiquiti%' OR title LIKE '%tplink%' OR title LIKE '%cisco%')", (net_id, gaming_id))

db.commit()
print("Updated categories")

