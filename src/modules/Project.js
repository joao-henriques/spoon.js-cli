var d          = require('dejavu'),
    BaseModule = require('../BaseModule'),
    automaton  = require('automaton')
;

var Project = d.Class.declare({
    $name: 'Project',
    $extends: BaseModule,

    _tmplComponent: __dirname + '/templates/component.json.tmpl',
    _tmplPackage:   __dirname + '/templates/package.json.tmpl',

    create: function (name, options) {
        console.log(('Creating project: ' + name).info);

        // create spoon project by running the autofile
        var spoon_scaffolding = require('../../plugins/spoon/project_create.autofile');
        options.name = name;
        automaton.run(spoon_scaffolding, options, function (err) {
            process.exit(err ? 1 : 0);
        });
    },

    // --------------------------------------------------

    run: function (options) {
        this._assertProject();

        console.log(('Running server').info);

        // run the server task
        var server = require(process.cwd() + '/tasks/server.js');
        automaton.run(server, options, function (err) {
            process.exit(err ? 1 : 0);
        });
    },

    // --------------------------------------------------

    test: function (options) {
        console.log('Not implemented yet'.warning);
    },

    // --------------------------------------------------

    deploy: function (options) {
        console.log('Not implemented yet'.warning);
    },

    // --------------------------------------------------
    // --------------------------------------------------

    getCommands: function () {
        return {
            'create <name>': {
                description: 'Create a new project',
                options: [
                    ['-f, --force', 'Force the creation of the project, even if a spoon project is already created', false, this._parseBoolean]
                ]
            },
            'run': {
                description: 'Run the project',
                options: [
                    ['-e, --env', 'The environment to run. Defaults to dev.', 'dev'],
                    ['-p, --port', 'The server port. Defaults to 8000.', 8000],
                    ['-h, --host', 'The server host. Defaults to 127.0.0.1', '127.0.0.1']
                ]
            }
            /*'test': {
                description: 'Run the unit tests of the whole project'
            },
            'deploy': {
                description: 'Deploy the project'
            }*/
        };
    }
});

module.exports = Project;