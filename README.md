# react-ant-admin 后台项目

本项目使用[express](https://www.expressjs.com.cn/)快速搭载项目。

使用前，请安装[nodejs](http://nodejs.cn/)环境，[mysql 数据库环境](https://www.mysql.com/)，[git 代码管理工具](https://git-scm.com/)。

## 安装

- 在系统盘下打开 dos 窗口(cmd)，运行以下命令拉取文件。

```shell
D:>git clone https://gitee.com/kong_yiji_and_lavmi/react-ant-admin-server.git
```

- 安装项目依赖

```shell
D:\react-ant-admin-server>cnpm i # or yarn install  / npm i
```

- 修改自己定义的配置

`token的secret 加密字符串`

```js
// ${root}/common/jwt.js
const secret = "your secret";
```

`项目启动地址，端口`

```js
// ${root}/common/index.js
module.exports = {
  host: "0.0.0.0",
  port: 8081,
};
```

`数据库地址，用户名，密码，数据库名`

```js
// ${root}/common/mysql.js
const pool = mysql.createPool({
  host: "127.0.0.1", // 本地
  user: "root",
  password: "your password",
  database: "react_admin", // 数据库名
  port: "3306",
  multipleStatements: true, // 允许同时执行多条sql语句
});
```

- 创建一个数据库名为`react_admin`,编码使用`utf8`,编码排序使用`utf8_general_ci`

在根目录下有一个`react_admin.sql`sql 备份文件。导入刚刚创建的数据库即可。

不太了解数据库的朋友在这里推荐使用[navicat](http://www.navicat.com.cn/)来导入数据库。

## 启动

完成了以上操作之后，即可开始启动项目。

```shell
D:\react-ant-admin-server>npm run start
```

此时出现一下语句即代表成功！

```
  server is starting:
    http://监听地址:端口号
```

## [接口文档地址](https://www.apifox.cn/apidoc/shared-9f3c246d-7ca8-4ef9-be4a-2802b68b93bb)

如有问题欢迎骚扰~
[qq 交流群:564048130](https://jq.qq.com/?_wv=1027&k=pzP2acC5)

![qrcode](https://gitee.com/kong_yiji_and_lavmi/my-image/raw/master/qq.jpg)
