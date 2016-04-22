/**
 * This simple Alexa skill demonstrates a simple skill using NightScout to report  
 * current blood glucose, trend, and variation from the last reading via the simple  
 * command "open pancreas" (or whatever name you give it during registration)
 */

var url = "";           
// The website address for your nightscout installation (without http[s]:// or a trailing slash - 
// i.e. yournightscoutname.azurewebsites.net

var path = "/pebble";   
// uses the pebble JSON data provided by nightscout, 
// which represents the current values for bg, trend, delta, etc.

var pancreasName = "The Magical Pancreas"; 
//The name you'd like to give Nightscout - used in the verbal response from Alexa only.

var http = require('https');
var https = require('https');
var querystring = require('querystring');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            //currently unused
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);
   getData(callback);
}

/**
 * Called when the user specifies an intent for this skill. Currently Not Implemented.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("IntentName" === intentName) {
       
    } else if ("SecondIntentName" === intentName) {
       
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function doCall(payload, options, onResponse,
                callback, intentName, intentSlots){

        var req = https.request(options, function(res) {
                res.setEncoding('utf8');

                 console.log("statusCode: ", res.statusCode);
                 console.log("headers: ", res.headers);


                res.on('data', function (chunk) {
                    console.log("body: " + chunk);
                    var parsedResponse = JSON.parse(chunk);
                    if (typeof onResponse !== 'undefined') {
                        onResponse(parsedResponse, callback, intentName, intentSlots);
                    }

                });

                res.on('error', function (chunk) {
                    console.log('Error: '+chunk);
                });

                res.on('end', function() {

                    //callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                });

            });

            req.on('error', function(e){console.log('error: '+e)});
            req.write(payload);

            req.end();

}

function getData(callback, intentName, intentSlots){
        console.log("sending request to nightscout...")
        var payload = "";
        var options = {
            host: url,
            path: path,
            method: 'GET',
           headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        console.log('making request with data: ',options);
        // get token and set callbackmethod to get measure
         doCall(payload, options, getMeasure, callback, intentName, intentSlots);
}

function getMeasure(parsedResponse, callback, intentName, intentSlots){

    var data = "";
    var currentTime = parsedResponse.status[0].now;
    var bg = parsedResponse.bgs[0].sgv;
    var trend = parsedResponse.bgs[0].trend;
    var direction = parsedResponse.bgs[0].direction;
    var bgdelta = parsedResponse.bgs[0].bgdelta;
    
    data += "glucose is " + bg + ". The trend is " + direction + " with a value of " + trend + ". The b g delta is " + bgdelta; 

console.log('parsedResponse: ', data);

    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput ;

    speechOutput = pancreasName + " says: " + data;
   

        callback(sessionAttributes,
             buildSpeechletResponse("", speechOutput, repromptText, shouldEndSession));

}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
