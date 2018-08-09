
from sshtunnel import SSHTunnelForwarder
import pymongo
import time
import sys
import os
import pymysql
import json


### Today ###
today = time.localtime(time.time())

year = str(today.tm_year)
month = str(today.tm_mon)

if month.__len__()<2:
    month = "0" + month

date = year + month


 
### Ready for data ###
group_companyId = [] 
group_companyName = []
group_companyDepart=[]
companyDict = {}

group_date = []
group_value = []
row = []

companyNum = 0
departNum = {}
itemNum = 0

'''
year = {}
data_2017 = [201706, 201707, 201708, 201709, 201710, 201711, 201712]
data_2018 = [201801, 201802, 201803, 201804, 201805, 201806, 201807]
year["2017"] = data_2017
year["2018"] = data_2018
'''

### Ready for mariadb connect ###
db = pymysql.connect(
                        host = "www.lems.mbz.kr",
                        user = "lems_user",
                        passwd = "Pass_%$#@",
                        db = "POWERMON",
                        port = 10336,
                        charset = "euckr"
                    )
    
cursor = db.cursor()



### Read COMPANY id & name ###
sql = "SELECT COMPANY_ID, COMPANY_NAME  FROM INFO_COMPANY"
companyNum = cursor.execute(sql)
row = [item for item in cursor.fetchall()]
group_companyId, group_companyName = zip(*row)
comNameDict = dict(zip(group_companyId, group_companyName))


### Read DEPART info ###
for i in range(0, companyNum):
    sql = "SELECT FromDSID, FromDISTBDID, DSNAME  FROM INFO_DS125_WebVersion  WHERE COMPANY_ID = %s AND FromDSID IS NOT NULL"
    departNum = cursor.execute(sql, (group_companyId[i]))
    row = [item for item in cursor.fetchall()]
    group_companyDepart.append(list(row))
companyDict = dict(zip(group_companyId, group_companyDepart))


### Read DSITEM id & name ###
sql = "SELECT DSITEMID, DSITEMNAMEENG  FROM INFO_DS125_ITEM  ORDER BY DSITEMID"
itemNum = cursor.execute(sql)
row = [item for item in cursor.fetchall()]
group_dsitemId, group_dsitemName = zip(*row)
dsitemDict = dict(zip(group_dsitemId, group_dsitemName))





dsitemD = {}
dsitemL = []
docD = {}
metaD = {}
dataNum = 0

### Ready for mongodb access ###
MONGO_HOST = "203.252.208.247"
MONGO_PORT = 22
MONGO_USER = "elec"
MONGO_PASS = "vmlab347!"
MONGO_DB = "company_monthly"
MONGO_COLLECTION = ""

### Define ssh tunnel ###
server = SSHTunnelForwarder(
    MONGO_HOST,
    ssh_username = MONGO_USER,
    ssh_password = MONGO_PASS,
    remote_bind_address = ('127.0.0.1', 27017)
)

### Start ssh tunnel ###
server.start()

client = pymongo.MongoClient('127.0.0.1', server.local_bind_port)
db = client[MONGO_DB]



for com in companyDict.keys():
    MONGO_COLLECTION = comNameDict.get(com)
    collection = db[MONGO_COLLECTION]
    for dept in companyDict.get(com):
        for item in dsitemDict.keys():
            sql = "SELECT MDATETIME, DSITEMVAL  FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B  WHERE B.FromDSID = A.DSID AND A.DSID = %s AND A.DISTBDID = %s AND DSITEMID = %s"
            dataNum = cursor.execute(sql, (int(date), dept[0], dept[1], item))
            row = [item for item in cursor.fetchall()]
            for r in row:
                r = list(r)
                r[0] = str(r[0])
                r[1] = str(r[1])
                dsitemD["date"] = r[0]
                dsitemD["value"] = r[1]
                dsitem = json.dumps(dsitemD)
                dsitemL.append(dsitem)

        metaD["company"] = comNameDict.get(com)
        metaD["year"] = date[:4]
        metaD["month"] = date[4:]
        metaD["item"] = dsitemDict.get(item)
        metaD["depart"] = dept[2]
        docD["meta"] = metaD
        docD["data"] = dsitemL
        docD = str(docD)
        if len(dsitemL) != 0:
            filename = 'C:\\Users\\DS\\Documents\\mydata_monthly\\' + comNameDict.get(com) + '\\' + str(dept[0]) + '_' + str(dept[1]) + '_' + str(item) + '_' + str(date) + '.json'
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            f = open(filename, 'wt')
            f.write(docD)
            print(filename)
            # collection.insert_one(docD)

        dsitemD = {}
        dsitemL = []
        docD = {}
        metaD = {}



### Close ssh tunnel ###
server.stop()
