function success(data) {
  return { success: true, data, error: null };
}

function error(message) {
  return { success: false, data: null, error: message };
}

module.exports = {
  success,
  error
};
