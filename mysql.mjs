import fs from "fs";
import mysql from "mysql2/promise";

fs.readFile(`student.txt`, "utf8", async (err, data) => {
  if (err) {
    throw Error(err);
  }

  const students = data.split(`\n`).map(x => {
    const [studentId, name] = x.match(/(B\d{8})\t(.*)/)[0].split(`\t`);

    return {
      studentId,
      name,
      grade: studentId.slice(1, 3),
      class: studentId.slice(5, 7)
    };
  });

  // ('名字', 'B00000000', NULL, '00', '0'),
  let sql = `INSERT INTO student (name, studentId, times, grade, class) VALUES `;

  students.forEach(x => {
    sql += `('${x.name}', '${x.studentId}', NULL, '${x.grade}', '${
      x.class
    }'), `;
  });
  sql = sql.slice(0, sql.length - 2);

  const connection = await mysql.createConnection({
    database: "exercise"
  });

  await connection.execute(`DELETE FROM student`);

  await connection.execute(sql);
  const [rows, fields] = await connection.execute(`SELECT * FROM student`);
  await connection.close();
});
