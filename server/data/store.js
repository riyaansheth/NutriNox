const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'store.json');
const DEFAULT_STATE = {
  user: { goal: "weight loss", preferences: [], restrictions: [] },
  foodLogs: [],
  insights: { lastGeneratedAt: null, summary: "" }
};

function initStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
  }
}

function getData() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch (error) {
    return DEFAULT_STATE;
  }
}

function saveData(obj) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
}

function appendFoodLog(entry) {
  const data = getData();
  if (!entry || !entry.id) return;
  data.foodLogs.push(entry);
  if (data.foodLogs.length > 500) {
    data.foodLogs = data.foodLogs.slice(data.foodLogs.length - 500); // keep last 500
  }
  saveData(data);
}

function getRecentMeals(n = 10) {
  const data = getData();
  return data.foodLogs.slice(-n);
}

function getUserGoal() {
  return getData().user.goal;
}

function setUserGoal(goal) {
  const data = getData();
  data.user.goal = goal;
  saveData(data);
}

module.exports = {
  initStore,
  getData,
  saveData,
  appendFoodLog,
  getRecentMeals,
  getUserGoal,
  setUserGoal
};
