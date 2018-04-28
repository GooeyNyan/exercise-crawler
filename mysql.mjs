import fs from "fs";
import mysql from "mysql2/promise";

const DATABASE_HOST = ``; // fill it
const DATABASE_USER = ``; // fill it
const DATABASE_NAME = ``; // fill it
const STUDENT_INFO = `student.txt`;

fs.readFile(STUDENT_INFO, "utf8", async (err, data) => {
  if (err) {
    throw new Error(err);
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
    host: DATABASE_HOST,
    user: DATABASE_USER,
    database: DATABASE_NAME
  });

  await connection.execute("DROP TABLE IF EXISTS `student`");
  await connection.execute(
    "CREATE TABLE `student` (" +
      "`id` int(11) unsigned NOT NULL AUTO_INCREMENT," +
      "`studentId` varchar(255) DEFAULT NULL," +
      "`name` varchar(255) DEFAULT NULL," +
      "`times` int(11) DEFAULT NULL," +
      "`grade` int(11) DEFAULT NULL," +
      "`class` int(11) DEFAULT NULL," +
      "PRIMARY KEY (`id`)" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8;"
  );

  await connection.execute(sql);
  await connection.close();
});
