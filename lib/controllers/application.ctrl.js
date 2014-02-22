/**
 * @fileOverview Application Bare CRUD methods
 */
var ControllerCrud = require('../controller-crud');

/**
 * Application Bare CRUD methods
 *
 * @contructor
 * @extends {kansas.ControllerCrud}
 */
module.exports = ControllerCrud.extend(function() {
  this.setOptions({
    idField: '_id',
    nameField: 'name',
    urlField: 'name',
  });
});
