const Boom              = require( "boom" );
const membershipModel   = require( "model/membership" );
const messages          = require( "model/messages" );
const mConstants        = require( "config" ).constants;
const membershipFetcher = function ( dataFromRequest , finCalBck )
	{
		"use strict";
		let filters = {};
		if ( dataFromRequest.membershipTypeId )
			{
				filters.id = dataFromRequest.membershipTypeId;
			}
		if ( dataFromRequest.membershipTypeName )
			{
				filters.name = dataFromRequest.membershipTypeName;
			}
		if ( dataFromRequest.hasOwnProperty( 'enabled' ) )
			{
				filters.enabled = dataFromRequest.enabled;
			}
		let membershipFetchPromise = membershipModel.getMembershipInfo( filters , [
			'id' ,
			'name' ,
			'ammountValue' ,
			'ammountMeasuredInUnit'
		] );
		membershipFetchPromise.then( function ( memberships )
		                      {
			                      if ( memberships === false )
				                      {
					                      return finCalBck( Boom.create( messages.errors.eng.notFound.NO_MEMBERSHIP_MATCH_THE_QUERY.statusCode ,
						                       messages.errors.eng.notFound.NO_MEMBERSHIP_MATCH_THE_QUERY.customMessage ) );
				                      }
			                      return finCalBck( null , {
				                      membershipTypes : memberships
			                      } );
		                      } )
		                      .fail( function ( err )
		                      {
			                      return finCalBck( Boom.create( 400 , err ) );
		                      } );
	};
const languageUpdate    = function ( dataFromRequest , finCalBck )
	{
		"use strict";
		let messagesCheck = messages.checkMessagesExistOrNot( dataFromRequest.messageID , dataFromRequest.languageID );
		const messagesModel = require( "model/messages" );
		messagesCheck.then( function ( resp )
		             {
			             if ( resp )
				             {
					             let updateMess = messages.updateMessages( dataFromRequest.messageID , dataFromRequest.languageID , {
						             customMessage : dataFromRequest.customMessage
					             });
					             updateMess.then(function (resp){
						             if(resp == true)
							             {
								             messagesModel.getMessages( {} , false , true )
								                          .then( function ( r )
								                          {
									                          setValueMessage( r , finCalBck );
								                          } );
							             }
						             else{
							             return finCalBck(resp);
						             }
					             })
				             }
			             else
				             {
					             let insertMess = messages.insertMessage( dataFromRequest.messageID , dataFromRequest.languageID , {
						             customMessage : dataFromRequest.customMessage
					             });
					             insertMess.then(function (resp){
						             if(resp==true)
							             {
								             messagesModel.getMessages( {} , false , true )
								                          .then( function ( r )
								                          {
									                          setValueMessage( r , finCalBck );
								                          } );
							             }
						             else{
							             return finCalBck(resp);
						             }
					             })
				             }
		             } )
		             .fail( function ( err )
		             {
			             return finCalBck( Boom.create( 400 , err ) );
		             } );
	}

	const expressionEval=function(request,callback)

	{
		solve();

		function solve() {
	  var exp=request.expression;
			//  exp = "5-10+(55*8)";
		    var post_exp = evaluate(exp);
		    //print(exp);
		  console.log(post_exp);
		  //  print(post_exp);
		    var a, ans_stack = [];
		    for (i = 0; i < post_exp.length; i++) {
		        if (isOperand(post_exp[i])) {
		            ans_stack.push(post_exp[i]);

		        } else {
		            var first = ans_stack.pop();
		            var second = ans_stack.pop();
		            //print(ans_stack);
		            //   print(post_exp[i]);
		            if (post_exp[i] == '*')

										ans_stack.push(first*second);
		            else
		            if (post_exp[i] == '/')

										ans_stack.push(second/first);
		            else
		            if (post_exp[i] == '+')
										ans_stack.push(first+second);

		            else
		            if (post_exp[i] == '-')

										ans_stack.push(second-first);

		            else
		            if (post_exp[i] == '^')
										ans_stack.push(Math.pow(first,second));

		        }

		    }

		    console.log(ans_stack[0]);
		    console.log(eval(exp));
				callback(null,ans_stack[0]);

		}

		function evaluate(exp) {
	    var i, k = -1;
	    //var exp = "2+5*(2-1)*7+(2+8)";
	    //print(exp);
	    console.log(exp);
	    var stack = [];
	    var ans = [];
	    for (i = 0; i < exp.length;) {
	        //   print(stack);
	        if (isOperand(exp[i])) {
	            var x = '';
	            while (isOperand(exp[i])) {
	                x += exp[i];
	                i++;
	            }
	            //  print(x);
	            ans[++k] = x;
	        } else if (exp[i] == '(')
	            stack.push(exp[i++]);
	        else if (exp[i] == ')') {
	            i++;
	            while (!isEmpty(stack) && peek(stack) != '(')
	                ans[++k] = stack.pop();
	            if (!isEmpty(stack) && peek(stack) != '(')
	                return -1;
	            else
	                stack.pop(); //  "(" remove
	        } else { //operator encountered
	            while (!isEmpty(stack) && Prec(exp[i]) <= Prec(peek(stack)))
	                ans[++k] = stack.pop();
	            stack.push(exp[i++]);
	        }

	    }
	    // print(ans);
	    var exp = [];
	    //print(isEmpty(stack));
	    while (!isEmpty(stack)) {
	        //print(peek(stack));
	        ans[++k] = stack.pop();
	    }

	    return ans;
	}


		function Prec(ch) {
		    switch (ch) {
		        case '+':
		        case '-':
		            return 1;

		        case '*':
		        case '/':
		            return 2;

		        case '^':
		            return 3;
		    }
return -1;
		}

		function peek(stack) {
		    return stack[stack.length - 1];
		}

		function isEmpty(stack) {
		    if (stack.length == 0) {
		        return true;
		    } else
		        return false;
		}

		function isOperand(ch) {
		    var result = (ch >= '0' && ch <= '9');
		    //  print(result);
		    return result;
		}


	}



module.exports          = {
	languageUpdate:languageUpdate,
	membershipFetcher : membershipFetcher,
	expressionEval:expressionEval
};
