/**
 * @fileOverview Application Bare CRUD methods
 */
var ControllerCrud = require('../controller-crud');
var ApplicationEntity = require('../../entities/application.ent');

/**
 * Application Bare CRUD methods
 *
 * @contructor
 * @extends {cc.ControllerCrud}
 */
module.exports = ControllerCrud.extendSingleton(ApplicationEntity, '/application', {
  idField: '_id',
  nameField: 'name',
  urlField: 'name',
  layoutView: 'layout/manage',
  editView: 'manage/app/edit',
});
