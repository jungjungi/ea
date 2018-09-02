
from sshtunnel import SSHTunnelForwarder
import pymongo
import time
import sys
import os
import pymysql
import json
import gridfs
import datetime
 
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
dataNum = 0

dsitemD = {}
dsitemL = []
docD = {}
metaD = {}
dd = {}

year = {}
data_2017 = [201706, 201707, 201708, 201709, 201710, 201711, 201712]
data_2018 = [201801, 201802, 201803, 201804, 201805, 201806, 201807, 201808, 201809]
year["2017"] = data_2017
year["2018"] = data_2018


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



### ready for mongodb access
MONGO_HOST = "203.252.208.247"
MONGO_PORT = 22
MONGO_USER = "elec"
MONGO_PASS = "vmlab347!"
MONGO_DB = "companyData"
MONGO_COLLECTION = ""

### define ssh tunnel
server = SSHTunnelForwarder(
    MONGO_HOST,
    ssh_username = MONGO_USER,
    ssh_password = MONGO_PASS,
    remote_bind_address = ('127.0.0.1', 27017)
)

### start ssh tunnel
server.start()

print("## Start !! ##")
print("##", datetime.datetime.today(), "##")

client = pymongo.MongoClient('127.0.0.1', server.local_bind_port)
db = client[MONGO_DB]



com = 40 # 신화개발
MONGO_COLLECTION = comNameDict.get(com)
collection = db[MONGO_COLLECTION]
fs = gridfs.GridFS(db)


for dept in companyDict.get(com):
    for item in dsitemDict.keys():
        for year_n in year.keys():

            for y in year.get(year_n):
                sql = "SELECT MDATETIME, DSITEMVAL  FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B  WHERE B.FromDSID = A.DSID AND A.DSID = %s AND A.DISTBDID = %s AND DSITEMID = %s"
                dataNum = cursor.execute(sql, (y, dept[0], dept[1], item))
                
                # 데이터가 존재하지 않으면 continue
                if dataNum == 0:
                    continue

                metaD["company"] = comNameDict.get(com)
                metaD["year"] = year_n
                month = str(y)
                metaD["month"] = month[4:]
                metaD["item"] = dsitemDict.get(item)
                metaD["depart"] = dept[2]
                docD["meta"] = metaD
                docD["data"] = []

                dd["meta"] = metaD
                d = collection.find_one(dd)

                # 해당 meta data가 존재하지 않으면 생성
                if(not(d)) :
                    collection.insert_one(docD)
                    d = collection.find_one(dd)

                print(docD["meta"])

                row = [item for item in cursor.fetchall()]
                for r in row:
                    r = list(r)
                    r[0] = str(r[0])
                    r[1] = str(r[1])
                    dsitemD["date"] = r[0]
                    dsitemD["value"] = r[1]
                    # collection.update({"_id":d["_id"]}, {"$push":{"data":dsitemD}})
                    # fs.put(docD) 
            
                # 초기화
                dsitemD = {}
                dsitemL = []
                docD = {}
                metaD = {}



print("## Successfully Insert Data !! ##")
print("##", datetime.datetime.today(), "##")


### close ssh tunnel
server.stop()
