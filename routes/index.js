var express = require("express");
var router = express.Router();
const reactAdmin = require("../module");

router.use(reactAdmin.countIP);
router.get("/getmessage", reactAdmin.getMsgList);
router.post("/login", reactAdmin.login);
router.get("/getmenu", reactAdmin.getMenu);
router.get("/getmenulist", reactAdmin.getMenuList);
router.post("/addmenu", reactAdmin.addMenu);
router.post("/addmessage", reactAdmin.addMsg);
router.get("/getpower", reactAdmin.getPower);
router.post("/delmenu", reactAdmin.delMenu);
router.get("/getmenuinfo", reactAdmin.getMenuInfo);
router.post("/editmenuinfo", reactAdmin.editMenu);
router.get("/getiplist", reactAdmin.getIP);
router.get("/getvisitordata", reactAdmin.getVisitor);
router.get("/getuserlist", reactAdmin.getUserList);
router.get("/getuserinfo", reactAdmin.getUserInfo);
router.post("/edituserinfo", reactAdmin.editUser);
router.post("/adduserinfo", reactAdmin.addUser);
router.post("/edittype", reactAdmin.editType);
router.post("/addtype", reactAdmin.addType);
/* 以下是新增的接口 */
// 1. 用户相关
router.get("/blind-box-get-user-list", reactAdmin.blindBoxGetUserList);
router.post("/blind-box-del-user", reactAdmin.blindBoxDelUser);
// 2. 盲盒相关
router.get("/blind-box-get-box-list", reactAdmin.blindBoxGetBoxList);
router.post("/blind-box-del-box", reactAdmin.blindBoxDelBox);
// 3. 表白墙相关
router.get("/blind-box-get-wall-list", reactAdmin.blindBoxGetWallList);
router.post("/blind-box-add-wall", reactAdmin.blindBoxAddWall);
router.post("/blind-box-del-wall", reactAdmin.blindBoxDelWall);
router.post("/blind-box-edit-wall", reactAdmin.blindBoxEditWall);
// 4. 大学相关
router.get(
  "/blind-box-get-university-list",
  reactAdmin.blindBoxGetUniversityList
);
router.post("/blind-box-add-university", reactAdmin.blindBoxAddUniversity);
router.post("/blind-box-del-university", reactAdmin.blindBoxDelUniversity);
router.post("/blind-box-edit-university", reactAdmin.blindBoxEditUniversity);

module.exports = router;
