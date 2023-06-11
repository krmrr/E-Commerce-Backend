import { ExpressHandlebars } from 'express-handlebars';
import * as Handlebars from 'handlebars';

const handlebarsHelpers = {
    // for detailed comments and demo, see my SO answer here http://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional/21915381#21915381

    /* a helper to execute an IF statement with any expression
      USAGE:
     -- Yes you NEED to properly escape the string literals, or just alternate single and double quotes
     -- to access any global function or property you should use window.functionName() instead of just functionName()
     -- this example assumes you passed this context to your handlebars template( {name: 'Sam', age: '20' } ), notice age is a string, just for so I can demo parseInt later
     <p>
       {{#xif " name == 'Sam' && age === '12' " }}
         BOOM
       {{else}}
         BAMM
       {{/xif}}
     </p>
     */
    xif: function (expression, options) {
        return handlebarsHelpers.x.apply(this, [expression, options])
            ? options.fn(this)
            : options.inverse(this);
    },
    /* a helper to execute javascript expressions
   USAGE:
   -- Yes you NEED to properly escape the string literals or just alternate single and double quotes
   -- to access any global function or property you should use window.functionName() instead of just functionName(), notice how I had to use window.parseInt() instead of parseInt()
   -- this example assumes you passed this context to your handlebars template( {name: 'Sam', age: '20' } )
   <p>Url: {{x " \"hi\" + name + \", \" + window.location.href + \" <---- this is your href,\" + " your Age is:" + window.parseInt(this.age, 10) "}}</p>
   OUTPUT:
   <p>Url: hi Sam, http://example.com <---- this is your href, your Age is: 20</p>
    */
    x: (expression, options) => {
        // you can change the context, or merge it with options.data, options.hash
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        // @ts-ignore
        const context = options.data;

        // NOTE: WITH IS REMOVED. COMMENTS BELOW ARE FROM ORIGINAL AUTHOR AND NOT VALID
        // yup, I use 'with' here to expose the context's properties as block variables
        // you don't need to do {{x 'this.age + 2'}}
        // but you can also do {{x 'age + 2'}}
        // HOWEVER including an UNINITIALIZED var in an expression will return undefined as the result.
        const result = function () {
            try {
                return eval(expression);
            } catch (e) {
                console.warn(
                    "•Expression: {{x '" + expression + "'}}\n•JS-Error: ",
                    e,
                    '\n•Context: ',
                    context,
                );
            }
        }.call(context); // to make eval's lexical this=context
        return result;
    },
    /*
    if you want access upper level scope, this one is slightly different
    the expression is the JOIN of all arguments
    usage: say context data looks like this:

    	// data
    	{name: 'Sam', age: '20', address: { city: 'yomomaz' } }

    	// in template
    	// notice how the expression wrap all the string with quotes, and even the variables
    	// as they will become strings by the time they hit the helper
    	// play with it, you will immediately see the errored expressions and figure it out

    	{{#with address}}
        	{{z '"hi " + "' ../this.name '" + " you live with " + "' city '"' }}
       	{{/with}}
  */
    z: function () {
        // eslint-disable-next-line prefer-rest-params
        const options = arguments[arguments.length - 1];
        // eslint-disable-next-line prefer-rest-params
        delete arguments[arguments.length - 1];
        return this.x.apply(this, [
            // eslint-disable-next-line prefer-rest-params
            Array.prototype.slice.call(arguments, 0).join(''),
            options,
        ]);
    },
    zif: function () {
        // eslint-disable-next-line prefer-rest-params
        const options = arguments[arguments.length - 1];
        // eslint-disable-next-line prefer-rest-params
        delete arguments[arguments.length - 1];
        return Handlebars.helpers['x'].apply(this, [
            // eslint-disable-next-line prefer-rest-params
            Array.prototype.slice.call(arguments, 0).join(''),
            options,
        ])
            ? options.fn(this)
            : options.inverse(this);
    },
};

export const handlebars = new ExpressHandlebars()
    .handlebars as typeof Handlebars;
handlebars.registerHelper(handlebarsHelpers);

export default handlebarsHelpers;
