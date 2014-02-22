/**
 * @fileOverview Application Bare CRUD methods
 */
var ControllerCrud = require('../controller-crud');
var ApplicationEntity = require('../../entities/application.ent');

/**
 * Application Bare CRUD methods
 *
 * @contructor
 * @extends {kansas.ControllerCrud}
 */
module.exports = ControllerCrud.extendSingleton(ApplicationEntity, '/application', {
  idField: '_id',
  nameField: 'name',
  urlField: 'name',
});
