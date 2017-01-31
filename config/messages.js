exports.messages =              {
	errors : {
		db :         {
			DB_NOT_INITIALIZED_PROPERLY : {//***Should be matched
				statusCode :    500 ,
					 customMessage : 'DB_NOT_INITIALIZED_PROPERLY' ,
					 type :          'DB_NOT_INITIALIZED_PROPERLY'//** Should be matched
			} ,
			PLEASE_TRY_AGAIN :            {
				statusCode :    500 ,
					 customMessage : 'PLEASE_TRY_AGAIN' ,
					 type :          'PLEASE_TRY_AGAIN'
			}
		} ,
		notFound :   {
			STRIPE_USER_NOT_FOUND :         {
				statusCode :    404 ,
					 customMessage : 'Please add a card first' ,
					 type :          'STRIPE_USER_NOT_FOUND'
			} ,
			CARD_NOT_FOUND :                {
				statusCode :    404 ,
					 customMessage : 'The card does not exist' ,
					 type :          'CARD_NOT_FOUND'
			} ,
			REFEREE_NOT_FOUND :             {
				statusCode :    404 ,
					 customMessage : 'The referee does not exist' ,
					 type :          'REFEREE_NOT_FOUND'
			} ,
			USER_NOT_FOUND :                {
				statusCode :    404 ,
					 customMessage : 'The user does not exist' ,
					 type :          'USER_NOT_FOUND'
			} ,
			EMAIL_NOT_REGISTERED :          {
				statusCode :    404 ,
					 customMessage : 'This email is not registered with us, please sign up' ,
					 type :          'EMAIL_NOT_REGISTERED'
			} ,
			NO_MEMBERSHIP_MATCH_THE_QUERY : {
				statusCode :    404 ,
					 customMessage : 'No membership(s) match with the given filters' ,
					 type :          'NO_MEMBERSHIP_MATCH_THE_QUERY'
			} ,
			NO_OCCASSIONS_MATCH_THE_QUERY : {
				statusCode :    404 ,
					 customMessage : 'No occassion(s) match with the given filters' ,
					 type :          'NO_OCCASSIONS_MATCH_THE_QUERY'
			}
		} ,
		violation :  {
			CARD_DECLINED :                {
				statusCode :    400 ,
					 customMessage : 'The card has been declined' ,
					 type :          'CARD_DECLINED'
			} ,
			INVALID_FILE_TYPE :            {
				statusCode :    400 ,
					 customMessage : 'Only jpg, jpeg, png and bmp files are allowed for upload' ,
					 type :          'INVALID_FILE_TYPE'
			} ,
			INSURANCE_DETAILS_INCOMPLETE : {
				statusCode :    400 ,
					 customMessage : 'insurancePolicyNumber, insuranceIssuedByCompany and insuranceExpirationDate all are required' ,
					 type :          'INSURANCE_DETAILS_INCOMPLETE'
			} ,
			INVALID_MEMBERSHIP :           {
				statusCode :    400 ,
					 customMessage : 'The membership selected is not valid for you' ,
					 type :          'INVALID_MEMBERSHIP'
			} ,
			INVALID_CREDENTIALS :          {
				statusCode :    400 ,
					 customMessage : 'The username or password is not valid' ,
					 type :          'INVALID_CREDENTIALS'
			} ,
			UNAUTHORIZED_ACCOUNT_STATE :   {
				statusCode :    400 ,
					 customMessage : 'This account has been marked invalid' ,
					 type :          'UNAUTHORIZED_ACCOUNT_STATE'
			} ,
			INVALID_ACCESS_TOKEN :         {
				statusCode :    401 ,
					 customMessage : 'The token is not valid anymore' ,
					 type :          'INVALID_ACCESS_TOKEN'
			} ,
			INVALID_ACCESS_TOKEN_FORMAT :  {
				statusCode :    401 ,
					 customMessage : 'The token is not in valid format(Please make sure you are not sending "bearer")' ,
					 type :          'INVALID_ACCESS_TOKEN_FORMAT'
			} ,
			THE_ID_IS_INVALID :            {
				statusCode :    400 ,
					 customMessage : 'The given id is invalid' ,
					 type :          'THE_ID_IS_INVALID'
			} ,
			REFERRAL_CODE_IS_YOURS :       {
				statusCode :    400 ,
					 customMessage : 'You can not use your own referral code to sign up' ,
					 type :          'REFERRAL_CODE_IS_YOURS'
			}
		} ,
		conflicts :  {
			DUPLICATE_CARD_DETAILS :      {
				statusCode :    409 ,
					 customMessage : 'This card is already registered with us.' ,
					 type :          'DUPLICATE_CARD_DETAILS'
			} ,
			EMAIL_ALREADY_EXISTS :        {
				statusCode :    409 ,
					 customMessage : 'This email is already registered with us, please sign up with a different email id.' ,
					 type :          'EMAIL_ALREADY_EXIST'
			} ,
			PHONE_NUMBER_ALREADY_EXISTS : {
				statusCode :    409 ,
					 customMessage : 'This phone number is already registered with us, please sign up with a different phone number.' ,
					 type :          'PHONE_NUMBER_ALREADY_EXISTS'
			} ,
			FACEBOOK_ID_ALREADY_EXISTS :  {
				statusCode :    409 ,
					 customMessage : 'This facebook account is already registered with us, please sign up with a different account.' ,
					 type :          'FACEBOOK_ID_ALREADY_EXISTS'
			} ,
			LINKEDIN_ID_ALREADY_EXISTS :  {
				statusCode :    409 ,
					 customMessage : 'This LinkedIn account is already registered with us, please sign up with a different account.' ,
					 type :          'LINKEDIN_ID_ALREADY_EXISTS'
			}
		} ,
		misMatches : {
			PASSWORDS_DIFFERENT : {
				statusCode :    400 ,
					 customMessage : 'Passwords do not match.' ,
					 type :          'PASSWORDS_DIFFERENT'
			}
		} ,
		missing :    {
			INSUFFICIENT_INFORMATION_PROVIDED : {
				statusCode :    400 ,
					 customMessage : 'The information provided was not sufficient to get results' ,
					 type :          'INSUFFICIENT_INFORMATION_PROVIDED'
			}
		}
	}
};
