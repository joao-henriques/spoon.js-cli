define([
    'spoon',
    './{{name}}View'
], function (spoon, {{name}}View) {

    'use strict';

    return spoon.Controller.extend({
        $name: '{{name}}Controller',

        /*_defaultState: 'index',
        _states: {
            'index': '_indexState'
        },*/

        _view: null,

        ////////////////////////////////////////////////////////////

        /**
         * Constructor.
         *
         * @param {Element} element The element in which the module will work on
         */
        initialize: function (element) {
            this.$super();

            this._view = this._link(new {{name}}View());
            this._view.appendTo(element);

            this.once('link', function () {
                this._view.render();
            }.$bind(this));
        },

        /**
         * Index state handler.
         *
         * @param {Object} state The state parameter bag
         */
        /*_indexState: function (state) {
            // The index state implementation goes here
            // The state might instantiate another module or simply a view
            // See the default ApplicationController implementation for an example
        },*/

        /**
         * {@inheritDoc}
         */
        /*_onDestroy: function () {
            // Cancel timers, ajax requests and other stuff here
            // Note that linked child views/controllers are automatically destroyed
            // when this controller is destroyed
            this.$super();
        }*/
    });
});
