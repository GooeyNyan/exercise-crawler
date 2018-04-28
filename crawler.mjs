import axios from "axios";
import qs from "qs";
import jsdom from "jsdom";
import mysql from "mysql2/promise";
const { JSDOM } = jsdom;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
axios.defaults.headers.post["Accept"] = "text/html";

const DATABASE_HOST = ``; // fill it
const DATABASE_USER = ``; // fill it
const DATABASE_NAME = ``; // fill it
const COFFEE_TIME = 2000; // take a rest for next requests
const CONCURRENCY = 10;
const REQUEST_URL = ``; // fill it

const getExercise = ({ studentId, name }) =>
  axios.post(REQUEST_URL, qs.stringify({ number: studentId, name }));

const justWaitForCoffee = () =>
  new Promise(resolve => {
    setTimeout(() => resolve("☕"), COFFEE_TIME);
  });

(async () => {
  const connection = await mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USER,
    database: DATABASE_NAME
  });

  const [students, fields] = await connection.execute(`SELECT * FROM student`);

  while (students.length) {
    const tempStudents = students.splice(0, CONCURRENCY);

    console.log(tempStudents);

    const values = await Promise.all(
      tempStudents.map(student => getExercise(student))
    );

    const times = values.map(
      ({ data }) =>
        new JSDOM(data).window.document.querySelector(`.badge`).innerHTML
    );

    console.log(times);

    await Promise.all(
      tempStudents.map((student, i) =>
        connection.execute("UPDATE student SET times = ? WHERE id = ?", [
          times[i],
          student.id
        ])
      )
    );

    await justWaitForCoffee();
  }

  connection.close();
})();
