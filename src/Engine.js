var d       = require('dejavu'),
    fs      = require('fs'),
    colors  = require('colors') // https://github.com/Marak/colors.js
    utils   = require('amd-utils'),
    os      = require('os'),
    inspect = require('util').inspect
;

// set up a useful set of formats
colors.setTheme({
    input: 'grey',
    info:  'green',
    data:  'grey',
    help:  'cyan',
    warn:  'yellow',
    debug: 'blue',
    error: 'red',
});

var Engine = d.Class.declare({
    $name: 'Engine',

    $constants: {
        FIRST_COLUMN_WIDTH: 30
    },

    _version:        '0.0.1',
    _modulesDir:     __dirname + '/modules/',
    _modules:        [],
    _moduleCommands: [],
    _argv:           null,
    _request:        {},

    initialize: function (argv) {
        this._loadModules();

        this._argv = argv;
    },

    parse: function () {
        var module,
            command,
            options,
            argvLen = this._argv.length;
        ;

        // if user didn't specify enough args, show usage
        // TODO: do not take into account options (--something or -s)
        if (argvLen < 4) {
            this.exitWithUsage();
        }

        this._request.module  = module  = this._argv[2];
        this._request.command = command = this._argv[3];
        this._request.args    = [];
        this._request.options = {};

        for (var i = 4; i < argvLen; ++i) {
            if (utils.lang.isUndefined(this._argv[i])) break;

            var arg = this._argv[i],
                optK,
                optV;

            // if arg is a shortcut for an option
            if (/-/.exec(arg)) {
                // translate the shortcut to the option
                //if ()
            }

            // if arg is an option
            if (/--/.exec(arg)) {
                var eqPos = arg.indexOf('=');

                // if the value was specified
                if (eqPos > 0) {
                    optK = arg.slice(2, eqPos);

                    this._assertOptionExists(module, command, optK);

                    optV = arg.slice(eqPos + 1);

                    // if there is a casting function, run it
                    castFn = this._moduleCommands[module][command].options[optK].cast;
                    if (utils.lang.isFunction(castFn)) {
                        console.log('casting');
                        optV = castFn(optV);
                    }
                }
                // only the option was passed, use its default value
                else {
                    optK = arg.slice(2);

                    this._assertOptionExists(module, command, optK);

                    optV = this._moduleCommands[module][command].options[optK].deflt;
                }
                
                // save the option
                this._request.options[optK] = optV;
            }
            // arg is not an option
            else {
                this._request.args.push(arg);
            }
        }

        console.log(this._request);
        process.exit();

        // run the command
        this.run(this._request.module, this._request.command, this._request.args, this._request.options);

        return this;
    },

    run: function (module, command, args, options) {
        // if command doesn't exist, show usage
        if (!this._existsHandler(module, command)) {
            this.exitWithUsage('Unrecognized command');
        }

        // check if all the required arguments were provided
        var cmdArgCount      = this._moduleCommands[module][command].argCount,
            providedArgCount = this._argv.length - 4
        ;
        // TODO: do not take into account options (--something or -s)
        if (cmdArgCount != providedArgCount) {
            this.exitWithCmdUsage('Missing required arguments', module, command);
        }

        // run the command
        this._modules[module][command].apply(this._modules[module], this._argv.slice(4));

        return this;
    },

    showUsage: function () {
        var moduleName,
            output;

        output = [
            '\nUsage: ' + (this._getScriptName() + ' <module> <command> [options]\n').cyan
        ];

        for (moduleName in this._modules) {
            var commands = this._modules[moduleName].getCommands();
            output.push(moduleName.green);

            for (var command in commands) {
                var description = commands[command].description;
                output.push(utils.string.rpad("  " + command, this.$self.FIRST_COLUMN_WIDTH).grey + " " + description);
            }

            output.push('');
        }

        this._output(output);

        return this;
    },

    showCommandUsage: function (module, command) {
        var output,
            optName,
            opts = this._moduleCommands[module][command].options;

        output = [
            '\n' + this._moduleCommands[module][command].description.info + '\n',
            'Usage: ' + (this._getScriptName() + ' ' + module + ' ' + this._moduleCommands[module][command].definition + '\n').cyan
        ];

        for (optName in opts) {
            output.push(utils.string.rpad('  ' + opts[optName].definition, this.$self.FIRST_COLUMN_WIDTH).grey + " " + opts[optName].description);
        }

        output.push('');

        this._output(output);
        process.exit();
    },

    exitWithUsage: function (err) {
        if (utils.lang.isString(err)) {
            console.error('\n' + err.error);
        }

        this.showUsage();
        process.exit();
    },

    exitWithCmdUsage: function (err, module, command) {
        if (utils.lang.isUndefined(this._moduleCommands[module][command])) {
            this.exitWithUsage('Invalid command provided');
        }

        if (utils.lang.isString(err)) {
            console.error('\n' + err.error);
        }

        this.showCommandUsage(module, command);
        process.exit();
    },

    _loadModules: function () {
        var filenames = fs.readdirSync(this._modulesDir),
            moduleName,
            i
        ;
        // foreach file in the modules folder, load it, and initialize it
        for (i in filenames) {
            moduleName = filenames[i].split('.',1)[0];

            // load the module
            this._loadModule(moduleName.toLowerCase(), this._modulesDir + moduleName + '/' + moduleName);
        }

//        console.log(inspect(this._moduleCommands, false, null));
    },

    _loadModule: function (name, file) {
        var module = require(file),
            modInstance,
            commands,
            command,
            cmdName,
            cmdArgs,
            options,
            option;

        this._modules[name.toLowerCase()] = modInstance = new module(this);

        this._moduleCommands[name] = {};

        // for each of the commands
        commands = modInstance.getCommands();
        for (command in commands) {
            // check how many arguments are required
            cmdName = command.split(/\s+/)[0];
            cmdArgs = command.match(/<[^>]+>/g);

            // save information for later validation
            this._moduleCommands[name][cmdName] = {
                'definition'      : command,
                'description'     : commands[command].description,
                'argCount'        : utils.lang.isArray(cmdArgs) ? cmdArgs.length : 0,
                'options'         : {},
                'optionShortcuts' : {}
            }

            // store option list
            options = commands[command].options;
            for (option in options) {
                var opt            = options[option],
                    optionName     = opt[0].split(/--/)[1],
                    optionShortcut = opt[0].split(/,/).length > 1 ? opt[0][1] : null;

                // save the option definition
                this._moduleCommands[name][cmdName].options[optionName] = {
                    definition  : opt[0],
                    description : opt[1],
                    deflt       : opt[2], // default value
                    cast        : opt[3]  // casting function
                }

                // if option has a shortcut, store it
                if (!utils.lang.isNull(optionShortcut)) {
                    this._moduleCommands[name][cmdName].optionShortcuts[optionShortcut] = optionName;                
                }
            }
        }
    },

    _existsHandler: function (module, command) {
        if (!utils.lang.isUndefined(this._modules[module]) && utils.lang.isFunction(this._modules[module][command])) {
            return true;
        }

        return false;
    },

    _output: function (outputArr) {
        for (var i in outputArr) {
            console.log(outputArr[i]);
        }
    },

    _getScriptName: function () {
        var script = this._argv[1].split(os.platform().match(/win32/) ? (/\\/) : (/\//));
        return script[script.length - 1];
    },

    _assertOptionExists: function (module, command, opt) {
        if (utils.lang.isUndefined(this._moduleCommands[module][command].options[opt])) {
            this.exitWithCmdUsage('Invalid option provided \'--' + opt + '\'', module, command);
        }
    }
});

module.exports = Engine;