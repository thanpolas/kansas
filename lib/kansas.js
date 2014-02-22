/*
 * Kansas
 * Rate limited API to go
 * https://github.com/thanpolas/kansas
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
var Kansas = require('./main/kansas.main.js');

/**
 * The main factory.
 *
 * @param {express} app An express instance.
 * @param {Object=} optOptions Options to configure Kansas.
 * @return {Kansas} A Kansas instance.
 */
module.exports = function(app, optOptions) {
  return new Kansas(app, optOptions);
};
