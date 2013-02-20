(function (root, factory)
{
    if (typeof define === 'function' && define.amd)
    {
        // AMD
        define(function(require, exports, module) {

            require("css!ratchet/dynamic/common.css");
            require("css!ratchet/dynamic/docviewer.css");

            var Ratchet = require("ratchet/web");
            var html = require("text!ratchet/dynamic/docviewer.html");

            require("ratchet/tmpl");
            require("bootstrap");

            return factory(Ratchet, html);
        });
    }
    else
    {
        return factory(root.Ratchet, "./docviewer.html");
    }

}(this, function(Ratchet, html) {

    return Ratchet.Gadgets.DocViewer = Ratchet.DynamicRegistry.register("docviewer", Ratchet.AbstractDynamicGadget.extend({

		TEMPLATE: html,

        prepareModel: function(el, model, callback)
        {
            var self = this;

            this.base(el, model, function() {

                callback();

            });
        },

        /**
         * @override
         */
        configure: function(gadgetIdentifier)
        {
            this.base(gadgetIdentifier);

            this.config({
                "defaults": {
                    "resource": {
                        "id": "",
                        "title": "",
                        "kind": "",
                        "url": "",

                        "size": -1,
                        "mimetype": "",
                        "filename": "",

                        "attachments": {

                        }
                    }
                },
                "observables": {
                    "previewResource": "previewResource" // the observable id to watch defining the resource
                }
            });

        },

        beforeSwap: function(el, model, callback)
        {
            var self = this;

            this.base(el, model, function() {

                // set up observables
                var refreshHandler = self.refreshHandler(el);

                // when the "previewResource" observable changes, update the doc viewer
                self.subscribe(model.observables.previewResource, refreshHandler);

                callback();

            });
        },


        afterSwap: function(el, model, context, callback)
        {
            var self = this;

            this.base(el, model, context, function() {

                // find the container
                var container = $(el).find(".viewer");

                // load the resource
                var resource = {};
                Ratchet.merge(self.config().defaults.resource, resource);
                var previewResource = self.observable("previewResource").get();
                if (previewResource)
                {
                    Ratchet.merge(previewResource, resource);

                    // build the condition
                    var condition = {};
                    Ratchet.merge(resource, condition);

                    // find all of the potential handlers
                    var handlers = Ratchet.ViewerRegistry.lookupHandlers(condition);
                    if (handlers.length == 0)
                    {
                        console.log("No resource viewer could be found for condition: " + JSON.stringify(condition));
                        callback();
                        return;
                    }

                    // walk handlers and try to execute each until one works
                    var exec = function(handlers, index)
                    {
                        if (index == handlers.length)
                        {
                            // ran off the end, didn't work
                            alert("Docviewer failed to render");

                            callback();

                            return;
                        }

                        var handler = handlers[index];

                        if (handler.canOperate())
                        {
                            handler.render(resource, container, function(err) {

                                if (!err) {

                                    // success
                                    callback();

                                    return;
                                }
                                else {

                                    // cleanup
                                    $(container).empty();

                                    // try next one
                                    exec(handlers, index+1);
                                }
                            });
                        }
                        else
                        {
                            // try next one
                            exec(handlers, index+1);
                        }
                    };
                    exec(handlers, 0);
                }
                else
                {
                    // nothing to do
                    callback();
                }
            });
        }

    }));

}));
