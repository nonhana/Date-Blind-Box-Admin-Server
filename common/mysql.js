const mysql = require("mysql");
const createError = require("http-errors");

const pool = mysql.createPool({
  host: "13.115.119.139",
  user: "root",
  password: "ec2demoserverdatabase",
  database: "dating-blind-box",
  port: "3306",
  multipleStatements: true, // 允许同时执行多条sql语句
});

function query(sql, params, next, callback) {
  if (typeof callback === "function") {
    dealQuery(sql, params, next).then(callback);
  } else {
    return dealQuery(sql, params, next);
  }
}
function transaction(sqls, params, next, callback) {
  if (typeof callback === "function") {
    dealTransaction(sqls, params, next).then(callback);
  } else {
    return dealTransaction(sqls, params, next);
  }
}

function dealQuery(sql, params, next) {
  return new Promise((res, rej) => {
    pool.getConnection((err, connection) => {
      if (err) {
        next(createError(500, err));
        rej(err);
        console.log(err);
        return;
      }
      connection.query(sql, params, (errors, results, fields) => {
        connection.release();
        if (errors) {
          next(createError(500, errors));
          rej(errors);
          console.log(errors);
          return;
        }
        res(results);
      });
    });
  });
}

function dealTransaction(sqls, params, next) {
  return new Promise((res, rej) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        next(createError(500, err));
        connection.release();
        rej();
        return;
      }
      if (sqls.length !== params.length) {
        next(createError(500, "语句与传值不匹配"));
        connection.release();
        rej();
        return;
      }
      connection.beginTransaction((beginErr) => {
        if (beginErr) {
          connection.release();
          next(createError(500, beginErr));
          rej();
          return;
        }
        console.log("开始执行事务，共执行" + sqls.length + "条数据");
        var funcAry = sqls.map((sql, index) => {
          return new Promise((sqlres, sqlrej) => {
            connection.query(sql, params[index], (sqlErr) => {
              if (sqlErr) {
                return sqlrej(sqlErr);
              }
              sqlres();
            });
          });
        });
        Promise.all(funcAry)
          .then(() => {
            connection.commit(function (commitErr, info) {
              if (commitErr) {
                console.log("执行事务失败，" + commitErr);
                connection.rollback(function () {
                  connection.release();
                });
                next(createError(500, commitErr));
                rej();
                return;
              }
              connection.release();
              res(info);
            });
          })
          .catch((error) => {
            connection.rollback(function (err) {
              console.log("transaction error: " + error);
              connection.release();
              next(createError(500, error));
              rej();
            });
          });
      });
    });
  });
}

module.exports = {
  query,
  transaction,
};
