const { query, transaction } = require("../common/mysql");
const { formatMenu, formatCreateTable, getVistor } = require("../utils");
const { getToken } = require("../common/jwt"); // 用来生成token的
const createError = require("http-errors"); // 用来创建错误对象的
const dayjs = require("dayjs"); // dayjs是用来格式化时间的工具

function getMsgList(req, res, next) {
  let { page = 1, pagesize = 10, name = "", description = "" } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  var sql =
    `select SQL_CALC_FOUND_ROWS *,DATE_FORMAT(add_time,"%Y-%m-%d %H:%i:%S") as add_time from message 
  where name like ? and description like ?  limit ?,?;
  select found_rows() as total;` + "show create table message;";
  let params = [
    `%${name}%`,
    `%${description}%`,
    (page - 1) * Number(pagesize),
    Number(pagesize),
  ];
  query(sql, params, next, (datalist) => {
    let createStr = datalist[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    res.send({
      status: 0,
      data: { list: datalist[0], mapKey, total: datalist[1][0].total },
      msg: "",
    });
  });
}

function login(req, res, next) {
  const { account, pswd } = req.body;
  let userInfo = req.user;
  if (userInfo) return res.send({ msg: "登录成功", status: 0, data: userInfo });
  if (!account || !pswd) {
    return res.send({ msg: "登录信息不能为空，请重试！", status: 1 });
  }
  let sql = "select * from user_info where account = ? and pswd = ?";
  query(sql, [account, pswd], next, (result) => {
    if (result && result.length) {
      let data = result[0];
      delete data.pswd;
      var token = getToken({ ...data });
      res.send({ msg: "登录成功", status: 0, token, data });
      return;
    }
    res.send({ status: 1, msg: "未找到账号信息，请重试！" });
  });
}

function getMenu(req, res, next) {
  var sql =
    "SELECT  * FROM `menu` WHERE `menu_id` IN (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(a.`menu_id`,',',b.help_topic_id + 1),',', -1 ) as menuId FROM (SELECT  p.menu_id FROM `user_info` as u INNER JOIN `power`as p ON u.`type_id` = p.`type_id` and u.user_id = ?) as a JOIN mysql.help_topic as b ON b.help_topic_id < (LENGTH(a.`menu_id`)-LENGTH(REPLACE(a.`menu_id`,',',''))+1)) ORDER BY menu.`order`;";
  query(sql, [req.user.user_id], next, (result) => {
    let data = result || [];
    res.send(data);
  });
}

function addMenu(req, res, next) {
  const {
    icon = "",
    key,
    parentKey = "",
    path,
    title,
    keepAlive,
    order,
  } = req.body;
  if (!key || !path || !title || !keepAlive || typeof order === "undefined")
    return res.send({
      msg: "参数错误",
      status: 1,
    });

  var sql = "insert into menu values(null,?,?,?,?,?,?,?,'true')";
  const parmas = [title, path, key, parentKey, icon, keepAlive, order];
  query(sql, parmas, next, function () {
    res.send({
      msg: "添加成功,菜单栏需要关闭页面重新打开即可生效！",
      status: 0,
    });
  });
}

function addMsg(req, res, next) {
  let userInfo = req.user;
  const { name, description } = req.body;
  if (!name || !description) return res.send({ status: 1, msg: "参数错误" });
  let sql = "insert into message values(null,?,?,?,?)";
  let params = [
    name,
    description,
    userInfo.username,
    dayjs().format("YYYY-MM-DD HH:ss:mm"),
  ];
  query(sql, params, next, () => res.send({ msg: "添加成功", status: 0 }));
}

function getPower(req, res, next) {
  let sql =
    "select * from power;show create table power;select * from menu order by menu.`order`;";
  query(sql, null, next, (reslut) => {
    let mapKey = formatCreateTable(reslut[1][0]["Create Table"]);
    let menu = formatMenu(reslut[2]);
    res.send({ status: 0, data: reslut[0], mapKey, menu });
  });
}

function delMenu(req, res, next) {
  let { key } = req.body;
  if (!key) return res.send({ msg: "参数错误", status: 1 });
  let sqls = [
    "delete from menu where `key` = ?",
    "delete from menu where parentKey = ?",
  ];
  let params = [[key], [key]];
  transaction(sqls, params, next)
    .then(() => {
      res.send({
        msg: "操作成功,菜单栏需要关闭页面重新打开即可生效！",
        status: 0,
      });
    })
    .catch((err) => {
      res.send({ msg: "操作失败", status: 1 });
    });
}

function getMenuInfo(req, res, next) {
  let { key } = req.query;
  if (!key) return res.send({ msg: "参数错误", status: 1 });
  let sql = "select * from menu where `key` = ?";
  query(sql, [key], next, (result) => {
    if (!result || result.length === 0) {
      return res.send({ msg: "未找到相关信息", status: 0 });
    }
    res.send({ status: 0, data: result[0] });
  });
}

function editMenu(req, res, next) {
  const {
    icon = "",
    key,
    path,
    title,
    parentKey = "",
    keepAlive,
    order,
  } = req.body;
  if (!key || !path || !title || !keepAlive || typeof order === "undefined")
    return res.send({ msg: "参数错误", status: 1 });
  let sql =
    "update menu set icon=?,path=?,title=?,parentKey=?,keepAlive=?,`order`=? where `key`=?";
  let params = [icon, path, title, parentKey, keepAlive, order, key];
  query(sql, params, next, () => {
    res.send({
      status: 0,
      msg: "修改成功,菜单栏需要关闭页面重新打开即可生效！",
    });
  });
}

function countIP(req, res, next) {
  let userInfo = req.user;
  let url = req.url;
  let passUrl = ["/login", "/api/react-ant-admin/login"];
  let passNextUrl = ["/getvisitordata", "/getiplist"];
  if (!userInfo && !passUrl.includes(url)) return next(createError(401));
  if (passNextUrl.includes(url)) return next();

  res.on("finish", () => {
    let time = dayjs().format("YYYY-MM-DD HH:mm:ss");
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    ip = ip.match(/\d+\.\d+\.\d+\.\d+/)[0];
    let statusCode = res.statusCode;
    console.log("----------");
    console.log(ip, url, time, statusCode);
    console.log("----------");
    let sql = "insert into statistics values(null,?,?,?,?)";
    let params = [ip, url, time, statusCode];
    query(sql, params, function (err) {
      console.log(err);
    });
  });
  next();
}

function getIP(req, res, next) {
  let { page = 1, pagesize = 10 } = req.query;
  if (page < 1 || pagesize < 1) return res.send({ status: 1, msg: "参数错误" });
  let sql =
    'select SQL_CALC_FOUND_ROWS url,DATE_FORMAT(time,"%Y-%m-%d %H:%i:%S") as time,`status`,CONCAT(LEFT(ip,3),".***.***.***") as ip,s_id from statistics limit ?,?;' +
    "select found_rows() as total;" +
    "show create table statistics;";
  let parmas = [(Number(page) - 1) * pagesize, Number(pagesize)];
  query(sql, parmas, next, function (result) {
    let createStr = result[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    let list = result[0];
    res.send({
      status: 0,
      data: { list, total: result[1][0].total, mapKey },
    });
  });
}

function getVisitor(req, res, next) {
  let sql =
    "select * ,DATE_FORMAT(time,'%Y-%m-%d %H:%i:%S') as time from statistics";
  query(sql, null, next, function (result) {
    let data = getVistor(result);
    res.send({ status: 0, data });
  });
}

function getUserList(req, res, next) {
  let { page = 1, pagesize = 10, name = "" } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  let sql =
    "select SQL_CALC_FOUND_ROWS u.*, CONCAT('********','') as pswd ,p.`name` as type_id,p.type_id as t_id from user_info as u LEFT JOIN power as p  ON p.type_id=u.type_id  where username like ? limit ?,?;" +
    "select found_rows() as total;" +
    "show create table user_info;";
  let params = [`%${name}%`, (page - 1) * Number(pagesize), Number(pagesize)];
  query(sql, params, next, (result) => {
    let list = result[0];
    let createStr = result[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    res.send({ status: 0, data: { list, mapKey }, total: result[1][0].total });
  });
}

function getUserInfo(req, res, next) {
  let { user_id } = req.query;
  if (!user_id) return res.send({ msg: "参数错误，请重试", status: 1 });
  let sql = "select *, CONCAT('','') as pswd from user_info where user_id = ?";
  let params = [user_id];
  query(sql, params, next, (result) => {
    if (!result || result.length === 0) {
      return res.send({ msg: "未找到用户信息，请仔细检查", status: 1 });
    }
    res.send({ status: 0, data: result[0] });
  });
}

function editUser(req, res, next) {
  let { user_id, username, account, pswd, type_id } = req.body;
  if (!user_id || !username || !account || !type_id)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  let modifyPswd = Boolean(pswd);
  let sql = modifyPswd
    ? "update user_info set username = ?, account=?, pswd=?, type_id=? where user_id=? "
    : "update user_info set username = ?, account=?, type_id=? where user_id=?";
  let params = modifyPswd
    ? [username, account, pswd, type_id, user_id]
    : [username, account, type_id, user_id];
  query(sql, params, next, (result) => {
    if (result.affectedRows === 1) {
      return res.send({ status: 0, data: null, msg: "修改成功" });
    }
    res.send({ status: 1, msg: "修改失败，请检查提交信息" });
  });
}

function addUser(req, res, next) {
  let { username, account, pswd, type_id } = req.body;
  if (!username || !account || !pswd || !type_id)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  let sql = "insert into user_info values(null,?,?,?,?)";
  let parmas = [username, account, pswd, type_id];
  query(sql, parmas, next, function (result) {
    if (result.affectedRows === 1) {
      return res.send({ status: 0, data: null, msg: "添加成功" });
    }
    res.send({ status: 1, msg: "添加用户信息失败，请检查提交信息" });
  });
}

function editType(req, res, next) {
  let { type_id, name, menu_id } = req.body;
  if (!name || !type_id || !Array.isArray(menu_id))
    return res.send({ msg: "参数错误，请重试", status: 1 });
  let sql = "update power set `name`=?,menu_id=? where type_id = ?;";
  let params = [name, menu_id.join(","), type_id];
  query(sql, params, next, (result) => {
    if (result.affectedRows === 1) {
      return res.send({ status: 0, data: null, msg: "修改成功" });
    }
    res.send({ status: 1, msg: "修改权限信息失败，请检查提交信息" });
  });
}

function addType(req, res, next) {
  let { name, menu_id } = req.body;
  if (!name || !Array.isArray(menu_id))
    return res.send({ msg: "参数错误，请重试", status: 1 });
  let sql = "insert into power values(null,?,?);";
  let params = [name, menu_id.join(",")];
  query(sql, params, next, (result) => {
    if (result.affectedRows === 1) {
      return res.send({ status: 0, data: null, msg: "添加成功" });
    }
    res.send({ status: 1, msg: "添加权限信息失败，请检查提交信息" });
  });
}

function getMenuList(req, res, next) {
  var sql =
    "SELECT  * FROM menu  ORDER BY menu.`order`; " + "show create table menu;";
  query(sql, null, next, (result) => {
    let createStr = result[1][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    let data = formatMenu(result[0] || []);
    res.send({ data, mapKey });
  });
}

/* 以下是自定义的接口 */
// 获取所有的用户列表
function blindBoxGetUserList(req, res, next) {
  let { page = 1, pagesize = 10, name = "" } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  var sql =
    `select SQL_CALC_FOUND_ROWS *,DATE_FORMAT(createdAt,"%Y-%m-%d %H:%i:%S") as createdAt from users 
  where user_name like ? limit ?,?;
  select found_rows() as total;` + "show create table users;";
  let params = [`%${name}%`, (page - 1) * Number(pagesize), Number(pagesize)];
  query(sql, params, next, (datalist) => {
    let createStr = datalist[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    res.send({
      status: 0,
      data: { list: datalist[0], mapKey, total: datalist[1][0].total },
      msg: "",
    });
  });
}
// 删除用户
function blindBoxDelUser(req, res, next) {
  let { user_id } = req.body;
  let sql = "delete from users where user_id = ?";
  query(sql, user_id, next, () => res.send({ msg: "删除成功", status: 0 }));
}

// 获取所有的盲盒列表
function blindBoxGetBoxList(req, res, next) {
  let { page = 1, pagesize = 10, name = "" } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  var sql =
    "select SQL_CALC_FOUND_ROWS *,DATE_FORMAT(createdAt,'%Y-%m-%d %H:%i:%S') as createdAt from `blind-boxes` where box_text like ?  limit ?,?;select found_rows() as total;" +
    "show create table `blind-boxes`";
  let params = [`%${name}%`, (page - 1) * Number(pagesize), Number(pagesize)];
  query(sql, params, next, (datalist) => {
    let createStr = datalist[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    res.send({
      status: 0,
      data: { list: datalist[0], mapKey, total: datalist[1][0].total },
      msg: "",
    });
  });
}
// 删除盲盒
function blindBoxDelBox(req, res, next) {
  let { box_id } = req.body;
  let sql = "delete from `blind-boxes` where box_id = ?";
  query(sql, box_id, next, () => res.send({ msg: "删除成功", status: 0 }));
}

// 获取所有的表白墙列表
function blindBoxGetWallList(req, res, next) {
  let { page = 1, pagesize = 10, name = "" } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  var sql =
    "select SQL_CALC_FOUND_ROWS *,DATE_FORMAT(createdAt,'%Y-%m-%d %H:%i:%S') as createdAt from `confession-walls` where wall_name like ?  limit ?,?;select found_rows() as total;" +
    "show create table `confession-walls`;";
  let params = [`%${name}%`, (page - 1) * Number(pagesize), Number(pagesize)];
  query(sql, params, next, (datalist) => {
    let createStr = datalist[2][0]["Create Table"];
    let mapKey = formatCreateTable(createStr);
    res.send({
      status: 0,
      data: { list: datalist[0], mapKey, total: datalist[1][0].total },
      msg: "",
    });
  });
}
// 新增表白墙
function blindBoxAddWall(req, res, next) {
  let { wall_name, university_id } = req.body;
  let sql =
    "insert into `confession-walls` set wall_name = ?,university_id = ?";
  query(sql, [wall_name, university_id], next, () =>
    res.send({ msg: "添加成功", status: 0 })
  );
}
// 删除表白墙
function blindBoxDelWall(req, res, next) {
  let { wall_id } = req.body;
  let sql = "delete from `confession-walls` where wall_id = ?";
  query(sql, wall_id, next, () => res.send({ msg: "删除成功", status: 0 }));
}
// 编辑表白墙
function blindBoxEditWall(req, res, next) {
  let { wall_id, wall_name, university_id } = req.body;
  let sql =
    "update `confession-walls` set wall_name = ?,university_id = ? where wall_id = ?";
  query(sql, [wall_name, university_id, wall_id], next, () =>
    res.send({ msg: "编辑成功", status: 0 })
  );
}

// 查询大学列表
function blindBoxGetUniversityList(req, res, next) {
  let { page = 1, pagesize = 10, name = "", selectAll = false } = req.query;
  if (Number(page) < 1 || Number(pagesize) < 10)
    return res.send({ msg: "参数错误，请重试", status: 1 });
  if (selectAll) {
    var sql = "select * from universities";
    query(sql, null, next, (datalist) => {
      res.send({
        status: 0,
        data: { list: datalist, mapKey: {}, total: datalist.length },
        msg: "",
      });
    });
  } else {
    var sql =
      `select SQL_CALC_FOUND_ROWS * from universities 
  where university_name like ?  limit ?,?;
  select found_rows() as total;` + "show create table universities;";
    let params = [`%${name}%`, (page - 1) * Number(pagesize), Number(pagesize)];
    query(sql, params, next, (datalist) => {
      let createStr = datalist[2][0]["Create Table"];
      let mapKey = formatCreateTable(createStr);
      res.send({
        status: 0,
        data: { list: datalist[0], mapKey, total: datalist[1][0].total },
        msg: "",
      });
    });
  }
}
// 新增大学
function blindBoxAddUniversity(req, res, next) {
  let { university_name } = req.body;
  let sql = "insert into universities set university_name = ?";
  query(sql, university_name, next, () =>
    res.send({ msg: "添加成功", status: 0 })
  );
}
// 删除大学
function blindBoxDelUniversity(req, res, next) {
  let { university_id } = req.body;
  let sql = "delete from universities where university_id = ?";
  query(sql, university_id, next, () =>
    res.send({ msg: "删除成功", status: 0 })
  );
}
// 编辑大学
function blindBoxEditUniversity(req, res, next) {
  let { university_id, university_name } = req.body;
  let sql =
    "update universities set university_name = ? where university_id = ?";
  query(sql, [university_name, university_id], next, () =>
    res.send({ msg: "编辑成功", status: 0 })
  );
}

// 将所有的接口暴露出去
module.exports = {
  getMsgList,
  login,
  getMenu,
  addMenu,
  addMsg,
  getPower,
  delMenu,
  getMenuInfo,
  editMenu,
  countIP,
  getIP,
  getVisitor,
  getUserList,
  getUserInfo,
  editUser,
  addUser,
  editType,
  addType,
  getMenuList,
  blindBoxGetUserList,
  blindBoxDelUser,
  blindBoxGetBoxList,
  blindBoxDelBox,
  blindBoxGetWallList,
  blindBoxAddWall,
  blindBoxDelWall,
  blindBoxEditWall,
  blindBoxGetUniversityList,
  blindBoxAddUniversity,
  blindBoxDelUniversity,
  blindBoxEditUniversity,
};
