const { MongoClient, ObjectId } = require('mongodb');
const util = require('./utilController');
const debug = require('debug')('app:addController');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

function generateMessage({ topic, time, date, location, replyTo }) {
  return `Reminder for appointment with World Relief\n\
Topic: ${topic}\n\
${time} ${date}\n\
${location ? location : ''}\n\
For Replies: ${replyTo}`;
}

const sendSMS = ({ topic, time, date, location, replyTo, phoneNumber }) => {
  let params = {
    Message: generateMessage({ topic, time, date, location, replyTo }),
    PhoneNumber: phoneNumber
  };

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
      const delay = item.epochTime - Date.now();
      setTimeout(() => {
        sendSMS({ phoneNumber: item.phoneNumber, replyTo: '7142104730' });
      }, delay);
    }

    res.redirect('/task/add');
  } catch (err) {
    debug(err);
  }
};
