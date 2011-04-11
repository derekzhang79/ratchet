(function($)
{
    Ratchet.ViewResolver = Ratchet.Abstract.extend(
    {
        constructor: function(dispatcher)
        {
            this.base();

            this.dispatcher = dispatcher;
        },

        registerMappings: function()
        {
        },

        getDispatcher: function()
        {
            return this.dispatcher;
        },

        getEl: function()
        {
            return this.getDispatcher().getElement();
        },

        register: function(uri, handler)
        {
            this.getDispatcher().mapViewResolver(this, uri, handler);
        }

        /**
         * Handles the render of the view.
         *
         * @param uri
         * @param method
         * @param modelAndView
         */
        /*
        handle: function(uri, modelAndView)
        {
            // TODO: override me
        }
        */

    });

})(jQuery);