var http = require('http'),
    express = require('express'),
    twilio = require('twilio'),
    bodyParser = require('body-parser'),
    request = require('request'),
    json = require('jsonfile'),
    SHA256 = require('crypto-js/sha256'),
    web3 = require('web3'),
    stringify = require('stringify'),
    parser = require('json-parser'),
    myVoiceIt = require('VoiceIt');

var app = express();
app.use(bodyParser.urlencoded({ extended: true })); 

var accountSid = 'AC65d3df83d34f73d1d2be344061d7003d'; // Your Account SID from www.twilio.com/console
var authToken = 'bc14d9d36d8f9d0854500f457cf48269';   // Your Auth Token from www.twilio.com/console
// Find your account sid and auth token in your Twilio account Console.
var client = new twilio.RestClient(accountSid, authToken);
var web3 = new web3(new web3.providers.HttpProvider('http://db0c88fb.ngrok.io'));
console.log(web3.isConnected);

//Initialise voice service
myVoiceIt.initialize('36a47c282a19448b9172554d058752b7');

var obj = {
  '1':{ 
    "id" : 1,
    "name" : "Fraser Edwards",
    "number" : +447912436449,
  },'2':{ 
    "id" : 2,
    "name" : "Tom Staley",
    "number" : +447595447886,
  },'3':{ 
    "id" : 3,
    "name" : "Gerrard Cowburn",
    "number" : +447875648296,
  },
};

var abi = [{"constant":true,"inputs":[],"name":"minter","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"source","type":"uint256"},{"name":"destination","type":"uint256"}],"name":"validate","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"destination","type":"uint256"},{"name":"amount","type":"uint256"}],"name":"cashout","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"source","type":"uint256"},{"name":"destination","type":"uint256"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"destination","type":"uint256"},{"name":"amount","type":"uint256"}],"name":"cashin","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"source","type":"uint256"}],"name":"checkbalance","outputs":[{"name":"","type":"bool"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"source","type":"uint256"},{"name":"destination","type":"uint256"}],"name":"register","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"balance","type":"uint256"}],"name":"checkbalanceevent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"reason","type":"string"}],"name":"registerevent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"reason","type":"string"}],"name":"validateevent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"reason","type":"string"},{"indexed":false,"name":"dstbalance","type":"uint256"}],"name":"cashinevent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"reason","type":"string"},{"indexed":false,"name":"dstbalance","type":"uint256"}],"name":"cashoutevent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},{"indexed":false,"name":"reason","type":"string"},{"indexed":false,"name":"srcbalance","type":"uint256"},{"indexed":false,"name":"dstbalance","type":"uint256"}],"name":"transferevent","type":"event"}]

var details = '/Users/Fraser/Desktop/SMSBlockchain/data.json'
var MyContract = web3.eth.contract(abi);
var mynodeaddress = '0xdb562d6e1472f94d241cd5492a08a10d1b075c2e';
var myContractAddress = '0x4d076caf2c71878f767bb38dde6bc2a9fed8aeb5';
var myContractInstance = MyContract.at(myContractAddress);

json.writeFile(details, obj, function (err) {
  console.error(err)
})

app.post('/', function(req, res) {
    var twilio = require('twilio');
    var twiml = new twilio.TwimlResponse();
    var str = req.body.Body;
    var fromNumber = req.body.From;

    if(!web3.isConnected()) {

        console.log('Web3 Connection Failed');

    } else {

        console.log('Web3 Connected');

    }

    console.log('Incoming message is' + str);

    if (str.toLowerCase() == 'check balance'){
        console.log('Invoking Check Balance function');

        var fromNumberBal = fromNumber.substr(1,13);
        console.log('Checking Number: ' + fromNumberBal);        
         var sendresult = myContractInstance.checkbalance.sendTransaction(fromNumberBal,
          {from: mynodeaddress}, function (error, result) {
            if (!error){
                console.log('1: '+ result);            
            }
            });
        var event = myContractInstance.checkbalanceevent({event: 'checkbalanceevent'});
        event.watch(function(error, eventresult){
            var test = JSON.stringify(eventresult);
            JSON.parse(test, (key, value) => {
                if (key == 'balance') { 
                    twiml.message("Your balance is: £"+ value);
                    res.writeHead(200, {'Content-Type': 'text/xml'});
                    res.end(twiml.toString());
                    console.log('Balance is £' + value);
                    console.log('EXPECT-CLOSE');
                };
            });
        });

    } else if(str.substr(0,str.indexOf(' ')).toLowerCase() == 'send'){
        console.log('Invoking Send Money function');

        var transfervalue = str.substr(str.indexOf('£')).substr(0,str.indexOf(' ')).substr(1,2);
        var toNumber = str.substr(str.indexOf('+')).substr(1,13);
        var passPhrase = str.substr(str.indexOf('#')+1);
        var fromNumberBal = fromNumber.substr(1,13);


        console.log('Transfer Value: ' + transfervalue);
        console.log('Destination: ' + toNumber);
        console.log('Source: ' + fromNumberBal);
        console.log('PassPhrase: ' + passPhrase); 
        var hash = "";  
      

        var sendresult = myContractInstance.transfer.sendTransaction(fromNumberBal, toNumber, transfervalue,
          {from: mynodeaddress}, function (error, result) {
            if (!error){
                console.log('1: '+ result);  
                hash = result;          
            }
            });
        var event = myContractInstance.transferevent({event: 'transferevent'});
        event.watch(function(error, eventresult){
            var test = JSON.stringify(eventresult);
            JSON.parse(test, (key, value) => {
                if (key == 'srcbalance') { 
                    twiml.message("You have sent £"+ transfervalue +" to "+ toNumber +", your balance is now "+ value + ". Your transaction reference is: " + hash);
                    res.writeHead(200, {'Content-Type': 'text/xml'});
                    res.end(twiml.toString());
                    console.log("You have sent £"+ transfervalue +" to "+ toNumber +", your balance is now "+ value + ". Your transaction reference is: " + hash);
                    console.log('EXPECT-CLOSE');
                };
            });
        });
    } else if(str.substr(0,str.indexOf(' ')).toLowerCase() == 'pair'){
        console.log('Invoking Pair function');

        var pairnumber = str.substr(str.indexOf('+')).substr(1,13);
        var passPhrase = str.substr(str.indexOf('#')+1);
        var fromNumberBal = fromNumber.substr(1,13);

        console.log('Destination: ' + pairnumber);
        console.log('Source: ' + fromNumberBal);
        console.log('Passphrase: ' + passPhrase);         

        var pairresult = myContractInstance.register.sendTransaction(fromNumberBal, pairnumber,
          {from: mynodeaddress}, function (error, result) {
            if (!error){
                console.log('1: '+ result);            
            }
            });
        var pairevent = myContractInstance.registerevent({event: 'registerevent'});
        pairevent.watch(function(error, eventresult){
            var eventjson = JSON.stringify(eventresult);
            JSON.parse(eventjson, (key, value) => {
                if (key == 'status' && value == true) { 
                    twiml.message("You have paired with "+ pairnumber);
                    res.writeHead(200, {'Content-Type': 'text/xml'});
                    res.end(twiml.toString());
                    console.log("Paired with " + pairnumber);
                    console.log('EXPECT-CLOSE');
                };
            });
        });

    } else if (str.toLowerCase() == 'register'){
        console.log('Invoking Register function');

        //Pass your 6 digit developer id as parameter to the intialize method like shown above
        myVoiceIt.createUser({
	        email: 'user@example.com',
	        password: 'Temporary1',
	        firstName: req.body.From,
	        lastName: req.body.From,
	        phone1: req.body.From,
	        //The API Call also accepts a phone3 argument if desired
	        callback: function(response){
	        //ADD CUSTOM CODE HERE TO USE
	        //DATA RECEIVED IN THE response VARIABLE
	        console.log("The Server Responded with the JSON: ",response);
            //The Server Responded with the JSON: { "Result" : "Success" }
	        }
        });
        twiml.message("Thanks for your interest, please call this number to authenticate");
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end(twiml.toString());

    } else {
        console.log('Inbound message invalid');

        twiml.message('Sorry, please can you try again?');
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end(twiml.toString());
        console.log('EXPECT-CLOSE');
    }
    
});

http.createServer(app).listen(3000, function () {
    console.log("Express server listening on port 3000");
});

//-----------------Phone call below ---------------------------//

var callerCredentials = function(body) {
   // Twilio's `body.From` is the caller's phone number, so let's use it as
   // identifier in the VoiceIt profile. It also means, the authentication is
   // bound only to this phone number.
   return  {
     number   : body.From,
     email    : body.From + '@temp.com',
     password : SHA256(body.From)
   };
};

// Accept Incoming Calls
// ---------------------
// We need to accept incoming calls from Twilio. The fully-qualified URL should
// be added to your Twilio account and publicly available.
app.post('/incoming_call', function(req, res) {

  console.log('Test');  
  var caller  = callerCredentials(req.body);
  var twiml   = new twilio.TwimlResponse();
  // Prepare options for the VoiceIt `GET /sivservice/api/users` API request.
  var options = {
    url: 'https://siv.voiceprintportal.com/sivservice/api/users',
    headers: {
      'VsitEmail'       : caller.email,
      'VsitPassword'    : caller.password,
      'VsitDeveloperId' : '36a47c282a19448b9172554d058752b7',
    }
  };

  request(options, function (error, response,  body) {
    // When VoiceIt responds with at `200`, we know the user's account profile
    // exists in the VoiceIt system.
    if (!error && response.statusCode == 200) {
      var voiceIt = JSON.parse(body);

      // Greet the caller when their account profile is recognized by the VoiceIt API.
      twiml.say(
        'You have called Voice Authentication. Your phone number has been recognized.'
      );
      // Let's provide the caller with an opportunity to enroll by typing `1` on
      // their phone's keypad.
      twiml.gather({
        action    : '/enroll_or_authenticate',
        numDigits : 1,
        timeout   : 3
      }, function () {
        this.say(
          'You can now log in, or press 1 now to enroll for the first time.'
        );
      });
      twiml.redirect('/enroll_or_authenticate?digits=TIMEOUT');

      res.send(twiml.toString());
    } else {
      switch(response.statusCode) {
        // Create a VoiceIt user when the HTTP status is `412 Precondition Failed`.
        case 412:
          // Prepare options for the VoiceIt `POST /sivservice/api/users` API request.
          var options = {
            url: 'https://siv.voiceprintportal.com/sivservice/api/users',
            headers: {
              'VsitDeveloperId' : '36a47c282a19448b9172554d058752b7',
              'VsitEmail'       : caller.email,
              'VsitFirstName'   : 'First' + caller.number,
              'VsitLastName'    : 'Last' + caller.number,
              'VsitPassword'    : caller.password,
              'VsitPhone1'      : caller.number
            }
          };

          request.post(options, function (error, response,  body) {
            if (!error && response.statusCode == 200) {
              var voiceIt = JSON.parse(body);
              console.log(voiceIt);
            } else {
              console.log(response.statusCode);
              console.log(body);
            }
          });

          twiml.say(
            'Welcome to the Voice Authentication system. You are a new user, ' +
            'you will now be enrolled.'
          );
          // Then we'll want to send them immediately to enrollment.
          twiml.redirect('/enroll');

          res.send(twiml.toString());
          break;
        default:
          new Error('An unhandled error occured');
      }
    }
  });
});

// Routing Enrollments & Authentication
// ------------------------------------
// We need a route to help determine what the caller intends to do.
app.post('/enroll_or_authenticate', function(req, res) {
  var digits = req.body.Digits;
  console.log("recieved digits = " + digits);
  var twiml  = new twilio.TwimlResponse();

  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to authenticate.
  if (digits == 1) {
    twiml.say(
      'You have chosen to create a new account with your voice. You will be ' +
      'asked to say a phrase 3 times, then you will be able to log in with that phrase.'
    );
    twiml.redirect('/enroll');
  } else {
    twiml.redirect('/authenticate');
  }

  res.send(twiml.toString());
});

// Enrollments
// -----------
app.post('/enroll', function(req, res) {
  var enrollCount = req.query.enrollCount || 0;
  var twiml       = new twilio.TwimlResponse();

  twiml.say('Please say the following phrase to enroll.');
  twiml.pause(1);
  twiml.say('Never forget tomorrow is a new day.');
  twiml.record({
    action    : '/process_enrollment?enrollCount=' + enrollCount,
    maxLength : '3',
    trim      : 'do-not-trim'
  });

  res.send(twiml.toString());
});

app.post('/authenticate', function(req, res) {
  var twiml = new twilio.TwimlResponse();

  twiml.say('Please say the following phrase to authenticate.');
  twiml.pause(1);
  twiml.say('Never forget tomorrow is a new day.');
  // We neeed to record a `.wav` file. This will be sent to VoiceIt for authentication.
  twiml.record({
    action    : '/process_authentication',
    maxLength : '3',
    trim      : 'do-not-trim',
  });

  res.send(twiml.toString());
});

app.post('/process_enrollment', function(req, res) {
  var caller       = callerCredentials(req.body);
  var enrollCount  = req.query.enrollCount;
  var recordingURL = req.body.RecordingUrl + ".wav";
  // Prepare options for the VoiceIt `POST /sivservice/api/enrollments/bywavurl API request.
  var options      = {
    url: 'https://siv.voiceprintportal.com/sivservice/api/enrollments/bywavurl',
    headers: {
      'VsitDeveloperId' : '36a47c282a19448b9172554d058752b7',
      'VsitEmail'       : caller.email,
      'VsitPassword'    : caller.password,
      'VsitwavURL'      : recordingURL
    }
  };

  request.post(options, function (error, response, body) {
    var twiml = new twilio.TwimlResponse();

    if (!error && response.statusCode == 200) {
      var voiceIt = JSON.parse(body);

      if (voiceIt.Result == 'Success') {
        enrollCount++;
        // VoiceIt requires at least 3 successful enrollments.
        if (enrollCount > 2) {
          twiml.say(
            'Thank you, recording recieved. You are now enrolled. You can log in.'
          );
          twiml.redirect('/authenticate');
        } else {
          twiml.say(
            'Thank you, recording recieved. You will now be asked to record your phrase again.'
          );
          twiml.redirect('/enroll?enrollCount=' + enrollCount);
        }
      } else {
        twiml.say('Sorry, your recording did not stick. Please try again.');
        twiml.redirect('/enroll?enrollCount=' + enrollCount);
      }
    } else {
      twiml.say('Sorry, your recording did not stick. Please try again');
      twiml.redirect('/enroll?enrollCount=' + enrollCount);
    }

    res.send(twiml.toString());
  });
});

app.post('/process_authentication', function(req, res) {
  var caller       = callerCredentials(req.body);
  var recordingURL = req.body.RecordingUrl + '.wav';
  var options      = {
    url: 'https://siv.voiceprintportal.com/sivservice/api/authentications/bywavurl',
    headers: {
      'VsitAccuracy'              : 5,
      'VsitAccuracyPassIncrement' : 2,
      'VsitAccuracyPasses'        : 4,
      'VsitConfidence'            : 89,
      'VsitDeveloperId'           : '36a47c282a19448b9172554d058752b7',
      'VsitEmail'                 : caller.email,
      'VsitPassword'              : caller.password,
      'VsitwavURL'                : recordingURL
    }
  };

  request.post(options, function(error, response, body) {
    var twiml = new twilio.TwimlResponse();

    if (!error && response.statusCode == 200) {
      var voiceIt = JSON.parse(body);
      console.log(voiceIt);

      switch(voiceIt.Result) {
        case 'Authentication failed.':
          twiml.say('Your authentication did not pass. Please try again.');
          twiml.redirect('/authenticate');
          break;
        default:
          twiml.say(voiceIt.Result);
      }
    } else {
      twiml.say('API Error. Your authentication did not pass. Please try again.');
      twiml.redirect('/authenticate');

      new Error(response.statusCode, body);
    }

    res.send(twiml.toString());
  });
});