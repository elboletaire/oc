'use strict';

var fs = require('fs-extra');
var spawn = require('cross-spawn');
var path = require('path');
var colors = require('colors/safe');
var execSync = require('child_process').execSync;
var Spinner = require('cli-spinner').Spinner;

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

var cli = shouldUseYarn() ? 'yarn' : 'npm';

module.exports = function (componentName, templateType, callback) {
  var templatePath = path.resolve(process.cwd(), templateType);
  var componentPath = path.join(process.cwd(), componentName);

  // Step 1 - Create componentName directory
  var step1 = new Spinner(`Creating directory...`);
  step1.start();
  fs.ensureDirSync(componentName);
  step1.stop(true);
  console.log(`${colors.green('✔')} Created directory "${componentName}"`);
  
  // Initialize npm
  var initProc = spawn.sync(cli, ['init', '--yes'], { silent: true, cwd: componentName });  

  // Step 2 - Install template module
  var local = /^\.\/|^\//.test(templateType);
  var args = {
    npm: [
      'install',
      '--save',
      '--save-exact',
      local
        ? templatePath
        : templateType
      ],
      yarn: [
        'add',
        '--exact',
        local
        ? templatePath
        : templateType
      ]
  };
  var step2 = new Spinner(`Installing ${templateType} from ${local ? 'local' : 'npm'}...`);
  step2.start();

  var installProc = spawn(cli, args[cli], {silent: true, cwd: componentName});

  installProc.on('error', function (error) {
    return callback('template type not valid');
  });

  installProc.on('close', function (code) {
    if (code !== 0) {
      return callback('template type not valid');
    }

    step2.stop(true);
    console.log(
      `${colors.green('✔')} Installed ${templateType} from ${local ? 'local' : 'npm'}`
    );

    // Step 3 - Copy boilerplates from the template module
    try {
      var step3 = new Spinner(`Creating boilerplate files...`);
      step3.start();

      var baseComponentPath = path.join(
        componentPath,
        'node_modules',
        templateType,
        'component'
      );

      var baseComponentFiles = path.join(baseComponentPath, 'src');

      fs.copySync(baseComponentFiles, componentPath);

      var packageContent = require(baseComponentPath + '/package');
      var initializedPackage = require(componentPath + '/package');

      packageContent.name = componentName;
      packageContent.dependencies = initializedPackage.dependencies;

      fs.writeJsonSync(componentPath + '/package.json', packageContent);
      step3.stop();
      console.log(`${colors.green('✔')} Boilerplate files created at ${componentPath}`);
      return callback(null, { ok: true });
    } catch (e) {
      console.error(colors.red(
        `Boilerplate generation failed, please report to ${templateType} owner`
        )
      );
      return callback('An error happened when initialising the component');
    }
  });
};