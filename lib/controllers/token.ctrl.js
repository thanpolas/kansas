/**
 * @fileOverview Token Bare CRUD methods
 */
var ControllerCrud = require('../controller-crud');

/**
 * Token Bare CRUD methods
 *
 * @contructor
 * @extends {kansas.ControllerCrud}
 */
module.exports = ControllerCrud.extend(function() {
  this.setOptions({
    idField: '_id',
    nameField: 'token',
    urlField: 'token',
  });
});