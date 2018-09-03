const { MongoClient, ObjectId } = require('mongodb');
const util = require('./utilController');
const debug = require('debug')('app:addController');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

function generateMessage({topic, time, date, location, replyTo})  {
    return `Reminder for appointment with World Relief\n\
Topic: ${topic}\n\
${time} ${date}\n\
${location}\n\
For Replies: ${replyTo}`;
}

const sendSMS = ({topic, time, date, location, replyTo, phoneNumber}) => {
    let params = {
        Message: generateMessage({topic, time, date, location, replyTo}),
        PhoneNumber: phoneNumber,
    };

    var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
    publishTextPromise.then(
        function(data) {
            console.log("MessageID is " + data.MessageId);
        }).catch( function(err) {
            console.error(err, err.stack);
    });
}

exports.addTask = (req, res) => {
  res.render('addTask', { title: 'Adding a Task' });
};

exports.saveTask = async (req, res) => {
  try {
    const task = req.body;
    const dbParams = await util.setupDB();
    await dbParams.collection.insertOne(task);
    dbParams.client.close();

    console.log(req.body);
    // sendSMS({topic: "N-400", time: "11.05", date: "Sep 30, 2018", 
    //   location: "13121 Brookhurst St H, Garden Grove",
    //   replyTo: "714-210-4730", phoneNumber: '+18585393586'});

    res.redirect('/');
  }

  catch(err) {
    debug(err);
  }
};
