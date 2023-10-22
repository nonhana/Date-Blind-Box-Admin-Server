const secret = "your secret";
const jwt = require("jsonwebtoken");
const exjwt = require("express-jwt");

function getToken(config) {
  let token = jwt.sign(config, secret, {
    algorithm: "HS256",
    expiresIn: 3600 * 12, // 12 hours
  });
  return token.replace(/\n/g, "");
}

function getTokenRule() {
  return exjwt({
    secret,
    algorithms: ["HS256"],
    credentialsRequired: false,
    getToken(req) {
      let token =
        req.headers.authorization || req.body.token || req.query.token || null;
      return token;
    },
  }).unless({ path: ["/api/react-ant-admin/login"] });
}

module.exports = {
  getTokenRule,
  getToken,
};
