(function() {

    var MODAL_TEMPLATE = ' \
        <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="overflow: visible !important"> \
            <div class="modal-header"> \
                <h3 class="modal-title"></h3> \
            </div> \
            <div class="modal-body"></div> \
        <div class="modal-footer"></div> \
    ';

    Ratchet.blockingModal = null;
    Ratchet.block = function(title, message)
    {
        if (Ratchet.blockingModal)
        {
            Ratchet.unblock(function() {
                Ratchet.block(title, message);
            });

            return;
        }

        Ratchet.blockingModal = Ratchet.showModal({
            "title": title,
            "cancel": true,
            "footer": false
        }, function(div, cb) {

            $(div).find('.modal-body').html("<p align='center'><img src='/components/ratchetweb/please-wait.gif'></p><br/><p align='center'>" + message + "<br/><br/></p>");

            cb();
        });

        return Ratchet.blockingModal;
    };

    Ratchet.unblock = function(callback)
    {
        if (Ratchet.blockingModal)
        {
            $(Ratchet.blockingModal).modal('hide');
            $(Ratchet.blockingModal).on('shown', function() {
                Ratchet.blockingModal = null;

                if (callback)
                {
                    callback();
                }
            });
        }
    };

    Ratchet.startModalGadget = function(options, overrides, beforeRatchetCallback, afterRatchetCallback)
    {
        var self = this;

        Ratchet.showModal({
            "title": options.title,
            "cancel": true
        }, function(div, cb) {

            var gadgetType = options.type;
            var gadgetConfiguration = options.config;
            if (!gadgetConfiguration) {
                gadgetConfiguration = {};
            }

            var tempGadgetId = options.id;
            if (!tempGadgetId) {
                tempGadgetId = "gadget-" + new Date().getTime();
            }
            var tempGadgetType = "type-" + new Date().getTime();

            // create an instance of the gadget
            var dynamicGadget = null;
            if (Ratchet.DynamicGadgets) {
                dynamicGadget = Ratchet.DynamicGadgets[gadgetType];
            }
            if (dynamicGadget)
            {
                // instantiate - config is loaded by gadget on configure()
                (function(tempGadgetType, gadgetConfiguration, dynamicGadget) {

                    // using meta-programming, create instances of page controllers
                    Ratchet.GadgetRegistry.register(tempGadgetType, dynamicGadget.extend({

                        setup: function() {
                            this.get("/gadget/" + tempGadgetType, this.index);
                        },

                        configureDefault: function() {
                            this.base();

                            // push page configuration into config service
                            this.config(gadgetConfiguration);
                        }

                    }));

                }(tempGadgetType, gadgetConfiguration, dynamicGadget));
            }
            else
            {
                Ratchet.logError("Cannot start modal for unknown gadget type: " + gadgetType);
                return;
            }

            // attributes
            $(div).find(".modal-body").attr("gadget", tempGadgetType);
            $(div).find(".modal-body").attr("id", tempGadgetId);

            $(div).find('.modal-footer').append("<button class='btn pull-right' data-dismiss='modal' aria-hidden='true'>Upload</button>");

             // ratchet it up
            var ratchet = $(div).ratchet(function() {

                this.parent = options.parent;

            });

            // set up ratchet callback
            if (beforeRatchetCallback)
            {
                beforeRatchetCallback.call(self, div, ratchet);
            }

            // run the ratchet
            ratchet.run("/gadget/" + tempGadgetType);

            if (overrides)
            {
                // get back the gadget bound into the ratchet
                for (var i = 0; i < ratchet.gadgetInstances.length; i++)
                {
                    for (var k in overrides)
                    {
                        ratchet.gadgetInstances[i][k] = overrides[k];
                    }
                }
            }

            // call any custom gadget callbacks (after ratchet callback)
            if (afterRatchetCallback)
            {
                for (var i = 0; i < ratchet.gadgetInstances.length; i++)
                {
                    afterRatchetCallback(div, ratchet, ratchet.gadgetInstances[i]);
                }
            }

            cb();

        });

    };

    /*
    Ratchet.startModalWizard = function(parent, wizardId, uri, beforeRatchetCallback, afterRatchetCallback)
    {
        Ratchet.startModalGadget({
            "parent": parent,
            "type": "wizard",
            "id": wizardId,
            "uri": uri
        }, {
            "closeWizard": function()
            {
                $(this.ratchet().el).modal("hide");
            }
        }, function(div, ratchet) {

            // append wizard attributes
            $(div).find('.modal-title').addClass("wizard-title");
            $(div).find('.modal-body').addClass("wizard-body");
            $(div).find('.modal-footer').addClass("wizard-buttons");

            if (beforeRatchetCallback) {
                beforeRatchetCallback.call(this, div, ratchet);
            }

        }, function(div, ratchet, gadget) {

            if (afterRatchetCallback) {
                afterRatchetCallback.call(this, div, ratchet, gadget);
            }
        });
    };
    */

    Ratchet.confirmDelete = function(title, body, onConfirm)
    {
        Ratchet.showModal({
            "title": title,
            "cancel": true
        }, function(div, cb) {

            $(div).find('.modal-body').html("<p align='center'><br/>" + body + "<br/><br/></p>");
            $(div).find('.modal-footer').append("<button class='btn pull-left' data-dismiss='modal' aria-hidden='true'>Cancel</button><button class='btn btn-danger pull-right confirm-delete'>Delete</button>");

            $(div).find('.confirm-delete').click(function() {

                $(div).modal('hide');

                onConfirm();
            });

            cb();
        });
    };

    Ratchet.showModalMessage = function(title, message)
    {
        Ratchet.showModal({
            "title": title,
            "cancel": true
        }, function(div, cb) {
            $(div).find('.modal-body').html("<p align='center'><br/>" + message + "<br/><br/></p>");
            $(div).find('.modal-footer').append("<button class='btn pull-right' data-dismiss='modal' aria-hidden='true'>Okay</button>");

            cb();
        });
    };

    Ratchet.showModal = function(config, setupFunction)
    {
        var self = this;

        if (!config) {
            config = {};
        }

        //Ratchet.unblock();

        if (!setupFunction)
        {
            setupFunction = function(div, callback) {
                callback(null);
            };
        }

        // build modal dom
        var div = $(MODAL_TEMPLATE);

        var title = "";
        if (config.title)
        {
            title = config.title;
        }

        // set up title
        $(div).find('.modal-title').html(title);

        // set up footer
        $(div).find('.modal-footer').html("");

        // auto-add cancel button
        if (config.cancel)
        {
            $(div).find('.modal-footer').append("<button class='btn pull-left' data-dismiss='modal' aria-hidden='true'>Cancel</button>");
        }

        if (typeof(config.footer) === "undefined") {
            config.footer = true;
        }

        if (!config.footer)
        {
            $(div).find(".modal-footer").remove();
        }

        // set up modal
        setupFunction.call(self, div, function(afterShownCallback) {

            if (afterShownCallback) {
                $(div).on("shown", function() {
                    afterShownCallback();
                });
            }

            // launch modal
            var t = $(div).modal({
                "keyboard": true
            });

            if (config.modalClass) {
                t.addClass(config.modalClass);
            }

        });

        return $(div);
    };

    // dynamic gadget types are stored here
    Ratchet.DynamicGadgets = {};
    Ratchet.DynamicRegistry = {
        register: function(type, classObject)
        {
            Ratchet.DynamicGadgets[type] = classObject;
            Ratchet.GadgetRegistry.register(type, classObject);

            return classObject;
        }
    };

})();