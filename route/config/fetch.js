"use strict";
const commonFunctions = require("Utils/CommonFunctions");
const appCriticalConfig = require('handler/config/global');
const config = require("config");
const Joi = require('joi');
const membershipTypes = {
    method: 'GET',
    path: '/config/fetchMemberships',
    handler: function (request, reply) {
        const queryData = request.query;
        appCriticalConfig.membershipFetcher(queryData, function (e, d) {
            "use strict";
            if (e) {
                return reply(e);
            } else {
                return reply(d)
                    .code(200);
            }
        });
    },
    config: {
        auth: false,
        description: 'Fetch membership types',
        tags: [
            'api',
            'config'
        ],
        validate: {
            query: {
                membershipTypeId: Joi.string()
                    .optional()
                    .trim(),
                membershipTypeName: Joi.string()
                    .optional()
                    .trim(),
                enabled: Joi.number()
                    .optional()
                    .integer()
                    .min(0)
                    .max(1),
            },
            failAction: commonFunctions.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                responseMessages: commonFunctions.swaggerDefaultResponseMessages
            }
        }
    }
};
const occassions = {
    method: 'GET',
    path: '/config/fetchOccassions',
    handler: function (request, reply) {
        const queryData = request.query;
        appCriticalConfig.occassionFetcher(queryData, function (e, d) {
            "use strict";
            if (e) {
                return reply(e);
            } else {
                return reply(d);
            }
        });
    },
    config: {
        auth: false,
        description: 'Fetch occassions',
        tags: [
            'api',
            'config'
        ],
        validate: {
            query: {
                occassionId: Joi.string()
                    .optional()
                    .trim(),
                displayNameForOccassion: Joi.string()
                    .optional()
                    .trim(),
                enabled: Joi.number()
                    .optional()
                    .integer()
                    .min(0)
                    .max(1),
            },
            failAction: commonFunctions.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                responseMessages: commonFunctions.swaggerDefaultResponseMessages
            }
        }
    }
};
const updateMesssages = {
    method: 'POST',
    path: '/config/updateMessages',
    handler: function (request, reply) {
        appCriticalConfig.languageUpdate(request.payload, function (e, d) {
            "use strict";
            if (e) {
                return reply(e);
            } else {
                return reply(d);
            }
        });
    },
    config: {
        auth: false,
        description: 'Update Messages Languages',
        tags: [
            'api',
            'config'
        ],
        validate: {
            payload: {
                languageID: Joi.string()
                    .required()
                    .trim(),
                messageID: Joi.string()
                    .required()
                    .trim(),
                customMessage: Joi.string()
                    .required()
                    .trim()
            },
            failAction: commonFunctions.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: commonFunctions.swaggerDefaultResponseMessages
            }
        }
    }
};

const EvalExp  = {
	method :  'GET' ,
	path :    '/ExpressionEval' ,
	handler : function ( request , reply )
		          {
			          const queryData = request.query;
			          appCriticalConfig.expressionEval( queryData , function ( e , d )
			          {
				          "use strict";
				          if ( e )
					          {
						          return reply( e );
					          } else
					          {
						          return reply( 'After Evaluation result='+d )
							           .code( 200 );
					          }
			          } );
		          } ,
	config :  {
		auth :        false ,
		description : 'Fetch membership types' ,
		tags :        [
			'api' ,
			'config'
		] ,
		validate :    {
			query :      {
				expression :   Joi.string()
				                        .trim()

			} ,
			failAction : commonFunctions.failActionFunction
		} ,
		plugins :     {
			'hapi-swagger' : {
				responseMessages : commonFunctions.swaggerDefaultResponseMessages
			}
		}
	}
};

module.exports = [
    membershipTypes,
    occassions,
    updateMesssages,
    EvalExp
];
