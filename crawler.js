const axios = require("axios");
const qs = require("qs");
const jsdom = require("jsdom");
const fs = require("fs");

const { JSDOM } = jsdom;

axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
axios.defaults.headers.post.Accept = "text/html";

const COFFEE_TIME = 2000; // take a rest for next requests
const CONCURRENCY = 5;
const REQUEST_URL = "aHR0cDovL3pjY3gudHliLm5qdXB0LmVkdS5jbi9zdHVkZW50"; // fill it

const getExercise = ({ studentId, name }) =>
  axios.post(REQUEST_URL, qs.stringify({ number: studentId, name }));

const justWaitForCoffee = () =>
  new Promise(resolve => {
    setTimeout(() => resolve("☕"), COFFEE_TIME);
  });

const result = [];
let id = 1;

const mapDataToTimes = data =>
  Array.from(
    new JSDOM(data).window.document.querySelectorAll(".list-group-item")
  ).map(i =>
    ["刷卡计数", "另外增加计数", "奖惩"].reduce((acc, type) => {
      if (i.innerHTML.includes(type)) {
        return {
          type,
          times: i.querySelector(".badge").innerHTML
        };
      }
      return acc;
    }, {})
  );

(async () => {
  const students = fs
    .readFileSync("./student.txt")
    .toString()
    .split("\n")
    .map(str => ({
      studentId: str.split("\t")[0],
      name: str.split("\t")[1]
    }));

  while (students.length) {
    const crawlingStudents = students.splice(0, CONCURRENCY);

    console.log(">>>>>>>>>>>>>>>>>>>>>> 正在爬取");
    console.log(crawlingStudents);
    let crawlResult;

    try {
      crawlResult = await Promise.all(
        crawlingStudents.map(student => getExercise(student))
      );
    } catch (e) {
      console.error(e);
    }

    const timesArray = crawlResult.map(({ data }) => mapDataToTimes(data));

    console.log(">>>>>>>>>>>>>>>>>>>> 爬取结果");
    console.log(
      JSON.stringify(
        crawlingStudents.map(({ studentId, name }, i) => ({
          studentId,
          name,
          times: timesArray[i].reduce(
            (acc, i) => acc + Number.parseInt(i.times),
            0
          ),
          record: timesArray[i]
        })),
        null,
        2
      )
    );
    console.log("\n\n");

    result.push(
      ...crawlingStudents.map(({ studentId, name }, i) => ({
        id: id++,
        studentId,
        name,
        times: timesArray[i].reduce(
          (acc, i) => acc + Number.parseInt(i.times),
          0
        ),
        record: timesArray[i]
      }))
    );

    fs.writeFileSync("result.json", JSON.stringify(result, null, 2));

    await justWaitForCoffee();
  }

  console.log(
    ">>>>>>>>>>>>>>>>>>>>>>>>>>>> 爬取结束，打开 result.json 或 result.txt 查看结果"
  );

  const now = new Date();
  const encodeMicrosoftExcelBuffer = content =>
    Buffer.concat([
      Buffer.from("\xEF\xBB\xBF", "binary"),
      Buffer.from(content)
    ]);

  fs.writeFileSync(
    "result.csv",
    encodeMicrosoftExcelBuffer(
      `学号,姓名,次数,,${now.getFullYear()}年${now.getMonth() +
        1}月${now.getDate()}日爬取,仅供参考,最终数据以体育部为准\n` +
        result
          .map(({ studentId, name, times }) => `${studentId},${name},${times}`)
          .join("\n")
    )
  );
})();
