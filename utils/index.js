var dayjs = require("dayjs");

function formatMenu(list) {
  if (Array.isArray(list)) {
    const obj = {};
    const newArr = [];
    list.forEach((item) => {
      const { key, parentKey } = item;
      if (!obj[key]) {
        obj[key] = item;
      } else {
        item.children = obj[key].children;
        obj[key] = item;
      }
      if (parentKey) {
        if (!obj[parentKey]) obj[parentKey] = { children: [obj[key]] };
        else if (!obj[parentKey].children) obj[parentKey].children = [obj[key]];
        else obj[parentKey].children.push(obj[key]);
      }
      if (!obj[key]["parentKey"]) {
        newArr.push(obj[key]);
      }
    });
    return newArr;
  }
  return [];
}

function formatCreateTable(str) {
  let arr = str.split(/\n/);
  let Reg = /^\s+`(.*?)`(.*?)COMMENT\s+'(.*?)'/g;
  let mapKey = [];
  arr.forEach((item) => {
    let res = Reg.exec(item);
    if (res) {
      mapKey.push({
        title: res[3],
        dataIndex: res[1],
        key: res[1],
      });
      Reg.lastIndex = 0;
    }
  });
  return mapKey;
}

function getVistor(list) {
  const todayTime = dayjs().format("YYYY-MM-DD");
  let today = {};
  let times = [];
  let visto_times = {};
  let data = {};
  let iptime = {};
  list.forEach((item) => {
    let day = dayjs(item.time).format("YYYY-MM-DD");
    if (iptime[day]) {
      iptime[day].push(item.ip);
    } else {
      iptime[day] = [item.ip];
    }
    if (!times.includes(day)) {
      times.push(day);
      visto_times[day] = 1;
    } else {
      visto_times[day] += 1;
    }
  });
  data.deal = Object.keys(visto_times).map((day) => {
    if (day === todayTime) {
      today.deal = visto_times[day];
    }
    return {
      time: day,
      value: visto_times[day],
    };
  });
  data.ips = Object.keys(iptime).map((day) => {
    let value = Array.from(new Set(iptime[day])).length;
    if (day === todayTime) {
      today.ips = value;
    }
    return { time: day, value };
  });
  data.today = today;
  return data;
}

module.exports = {
  formatMenu,
  formatCreateTable,
  getVistor,
};
