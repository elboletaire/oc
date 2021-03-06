'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('underscore');

module.exports = function(){

  return function(componentsDir, callback){

    const isOcComponent = function(file){

      const filePath = path.resolve(componentsDir, file),
        packagePath = path.join(filePath, 'package.json');
      let content;

      try {
        content = fs.readJsonSync(packagePath);
      }
      catch(err)
      {
        return false;
      }

      const packagedProperty = content.oc && content.oc.packaged;

      return _.isUndefined(packagedProperty);
    };

    let dirContent;

    try {
      dirContent = fs.readdirSync(componentsDir);
    } catch(err){
      return callback(null, []);
    }

    const components = dirContent.filter(isOcComponent).map(function(component) {
      return path.resolve(componentsDir, component);
    });

    callback(null, components);
  };
};
