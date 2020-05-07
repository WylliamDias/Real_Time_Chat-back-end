function userManager() {
  this.users = [];
}

userManager.prototype = {
  addUser: function (item) {
    this.users.push(item);
  },
  findOne: function (user) {
    const response = this.users.find(element => element.name === user.name);
    return response;
  },
};

module.exports = userManager;
