self.defaults = {
  'password.charset': 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  'password.length': 12,
  'types': '^(?:(?:text(?:area)?)|(?:select-(?:(?:one)|(?:multiple)))|(?:checkbox)|(?:radio)|(?:email)|(?:url)|(?:number)|(?:month)|(?:week)|(?:tel)|(?:file))$'
};

self.defaults.detect = 'body'; // body or forms

self.defaults.profile = {
  'user-name': 'my-user-name',
  'email': 'me@mydomain.com',
  'title': 'Mr.',
  'gender': 'male',
  'age': '30',
  'first-name': 'my first name',
  'middle-name': 'my middle name',
  'last-name': 'my last name',
  'name-suffix': 'my name suffix',
  'full-name': 'my full name',
  'street-line-1': 'street address line number one',
  'street-line-2': 'street address line number two',
  'street-line-3': 'street address line number three',
  'full-street': 'full street address',
  'city': 'city name',
  'state': 'state name',
  'zip-code': 'zip code or postal code',
  'country-code': 'US',
  'country': 'country name',
  'lang': 'language',
  'birth-day-type-1': '1',
  'birth-day-type-2': '01',
  'birth-month-number-type-1': '1',
  'birth-month-number-type-2': '01',
  'birth-month-string': 'January',
  'birth-year': '1971',
  'company': 'company name',
  'occupation': 'occupation',
  'phone': '(123) 456-7890',
  'homepage': 'http://my-home-page.com',
  'comment': 'this is a comment'
};

self.defaults.rules = {
  'birth-day-type-1': {
    'field-rule': '(?:dd)|(?:bday)|(?:birth\\w?day)|(?:dob\\w?day)|(?:birth\\w*1)',
    'site-rule': '(?:)'
  },
  'birth-day-type-2': {
    'field-rule': '(?:dd)|(?:bday)|(?:birth\\w?day)|(?:dob\\w?day)|(?:birth\\w*1)',
    'site-rule': '(?:)'
  },
  'birth-month-number-type-1': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-month-number-type-2': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-month-string': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-year': {
    'field-rule': '(?:yy)|(?:byear)|(?:birth\\w?year)|(?:dob\\w?year)|(?:birth\\w*3)',
    'site-rule': '(?:)'
  },

  'full-street': {
    'field-rule': '(?:street)|(?:addr)',
    'site-rule': '(?:)'
  },

  'full-name': {
    'field-rule': 'name',
    'site-rule': '(?:)'
  },


  'state': {
    'field-rule': '(?:state)|(?:prov)|(?:region)',
    'site-rule': '(?:)'
  },
  'zip-code': {
    'field-rule': '(?:zip)|(?:post[\\w\\s]*code)',
    'site-rule': '(?:)'
  },

  'user-name': {
    'field-rule': '(?:(?:username)|(?:login)|(?:user_id)|(?:membername))(?!\\w*pass)',
    'site-rule': '(?:)'
  },
  'title': {
    'field-rule': '(?:prefix[\\w\\s]*name)|(?:name[\\w\\s]*prefix)|(?:title)',
    'site-rule': '(?:)'
  },
  'gender': {
    'field-rule': '(?:gender)|(?:sex)',
    'site-rule': '(?:)'
  },

  'lang': {
    'field-rule': 'lang',
    'site-rule': '(?:)'
  },
  'age': {
    'field-rule': 'age',
    'site-rule': '(?:)'
  },

  'occupation': {
    'field-rule': '(?:occupation)|(?:job)',
    'site-rule': '(?:)'
  },
  'phone': {
    'field-rule': '(?:phone)|(?:tel)|(?:phon)',
    'site-rule': '(?:)'
  },

  'comment': {
    'field-rule': '(?:commnt)|(?:comment)|(?:description)',
    'site-rule': '(?:)'
  },

  'first-name': {
    'field-rule': '(?:fname)|(?:first[\\w\\s]*name)|(?:frst[\\w\\s]*name)|(?:name[\\w\\s]*first)',
    'site-rule': '(?:)'
  },
  'middle-name': {
    'field-rule': '(?:middle[\\w\\s]*name)|(?:name[\\w\\s]*middle)',
    'site-rule': '(?:)'
  },
  'last-name': {
    'field-rule': '(?:lname)|(?:last[\\w\\s]*name)|(?:name[\\w\\s]*last)',
    'site-rule': '(?:)'
  },

  'name-suffix': {
    'field-rule': '(?:suffix[\\w\\s]*name)|(?:name[\\w\\s]*suffix)',
    'site-rule': '(?:)'
  },

  'email': {
    'field-rule': '(?:mail)',
    'site-rule': '(?:)'
  },

  'street-line-1': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*1',
    'site-rule': '(?:)'
  },
  'street-line-2': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*2',
    'site-rule': '(?:)'
  },
  'street-line-3': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*3',
    'site-rule': '(?:)'
  },
  'city': {
    'field-rule': 'city',
    'site-rule': '(?:)'
  },
  'country-code': {
    'field-rule': '(?:country[\\w\\s]*code)|(?:phone[\\w\\s]*country)',
    'site-rule': '(?:)'
  },
  'country': {
    'field-rule': 'country',
    'site-rule': '(?:)'
  },

  'company': {
    'field-rule': 'company',
    'site-rule': '(?:)'
  },
  'homepage': {
    'field-rule': '(?:web)|(?:homepage)|(?:www)|(?:url)',
    'site-rule': '(?:)'
  }
};
