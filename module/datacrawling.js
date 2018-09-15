
/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const request = require('request');
const cheerio = require('cheerio');

const express = require("express");
// var urlencode = require('urlencode');
// var router = express.Router();

const crawling = require('./datacrawling_main').datacrawling;

var res = new Array;

var company;    // company name
var dsid;       // company id
var category;   // data category
var depart = new Array;     // departs name
var myDate = new Array;     // date string

/* 

data category

3: 누적전력량
5: 주파수
6: 선간전압
7: 상전류
8: 상전압
9: 부스바온도
10: 전기요금
11: 인버터효율
12: RS간 선간전압
13: ST간 선간전압
14: TR간 선간전압
15: 역률
16: 유효전력
17: 피상전력
21: 무효전력 

*/

console.log("start")
main(3, "(주)엘케이")


function main () {
    request("http://165.246.39.81:54231/", (error, response, body) => {
        if (error) throw error;

        let $ = cheerio.load(body);

        try {
            
            $('a').each(function(i, e){
                let s = e.attribs.href;
                s = s.split("?");
                s = s[1].split("&");

                maindata.push(s);

                let company = s[0].split("=");
                s[0] = company[1]; 

                let depart = s[1].split("=");
                s[1] = depart[1];

                let dsid = s[2].split("=");
                s[2] = dsid[1];

                let distbdid = s[3].split("=");
                s[3] = distbdid[1];
            })

        } catch (error){
            console.error(error);
        }

        console.log("hello")

        return maindata;
    }); 
}


function sub (categoryNumber, companyName){

    company = companyName;
    category = categoryNumber;

    // from datacrawling_main.js
    maindata = crawling(company);
/*
    maindata.forEach(function(d, i){
        if (company == d[0]) {
            dsid = d[2];
            depart.push(d[1]);
        }

    });
*/
    console.log(company, depart);

    
/*
    // date info
    var today = new Date()      // today
    y = today.getFullYear();    // this year
    m = today.getMonth()+1;     // this month
    d = today.getDate();        // this date
    leapyear = false;           // is this year leap year?

    // data format : date -> string
    // today = today.toISOString().slice(0,10).replace("-","").replace("-","");

    if ((y%400==0) || (y%4==0 && y%100!=0)){    // 윤년 2월일때 29일까지
        leapyear = true;
    } else {                                    // 평년 2월일때 28일까지
        leapyear = false;
    }
*/

}


// module.exports.router = router;