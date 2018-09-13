const { MongoClient, ObjectId } = require('mongodb');
const util = require('./utilController');
const debug = require('debug')('app:addController');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

function generateMessage({
  topic,
  epochTime,
  timeZone = 'America/Los_Angeles',
  language = 'en-us',
  provider = 'World Relief',
  replyTo
}) {
  return `Reminder for appointment with ${provider}\n\
Topic: ${topic}\n\
${new Date(epochTime).toLocaleString(language, { timeZone })}\n\
For Replies: ${replyTo}`;
}

const sendSMS = ({
  topic,
  epochTime,
  replyTo,
  phoneNumber,
  timeZone,
  language
}) => {
  let params = {
    Message: generateMessage({ topic, epochTime, replyTo, timeZone, language }),
    PhoneNumber: phoneNumber
  };
  console.log(params);
  var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' })
    .publish(params)
    .promise();
  publishTextPromise
    .then(function(data) {
      console.log('MessageID is ' + data.MessageId);
    })
    .catch(function(err) {
      console.error(err, err.stack);
    });
};

exports.addTask = (req, res) => {
  res.render('addTask', { title: 'Adding a Task' });
};

exports.saveTask = async (req, res) => {
  try {
    const body = req.body;
    for (let item of body.events) {
      const delay = item.epochTime - Date.now() - 86400000;
      console.log(delay);
      if (delay < 5) {
        //event is basically already happening, or happened
        continue;
      }
      setTimeout(() => {
        sendSMS({
          topic: item.title,
          phoneNumber: item.phoneNumber,
          epochTime: item.epochTime,
          replyTo: '7142104730'
        });
      }, delay);
    }

    res.redirect('/task/add');
  } catch (err) {
    debug(err);
  }
};
