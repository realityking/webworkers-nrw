'use strict';

const Alexa = require('alexa-sdk');
const contentful = require('contentful');

const client = contentful.createClient({
  space: 'euawp8ua75m5',
  accessToken: '89a3dbf338e52b6c183835e3a372b374ee001e7278705f90a2ed45074cca6448'
});

function logError(err) {
  console.error(err)
}

function getNextMeetup() {
  return client.getEntries({
    content_type: 'meetup',
    order: '-fields.date',
    include: 2,
    limit: 1
  }).then(function (data) {
    const ctfObject = data.items[0].fields;

    const talk = ctfObject.talk.map(function (talk) {
      const fields = talk.fields;
      const speaker = fields.speaker.map(function getFields(entry) {
          return entry.fields.name;
      });

      return {
        title: fields.title,
        description: fields.description,
        speaker: speaker
      };
    });

    return {
      title: ctfObject.title,
      date: new Date(ctfObject.date),
      talk: talk
    };
  });
}

function getToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  return date;
}

function formatSpeakers(list) {
  if (list.length === 1) {
    return list[0];
  }

  return list.slice(0, -1).join(', ') + ' und ' + list.slice(-1);
}

const deMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function nextMeetUpWhenIntent() {
  getNextMeetup()
    .then((meetup) => {
      const today = getToday();
      const meetupDate = meetup.date;
      let speechOutput = '';
      if (meetupDate > today) {
        speechOutput = 'Das nächste Meetup der Webworker NRW ist noch nicht angekündigt. Kommt aber bestimmt bald!';
      } else {
        speechOutput = 'Das nächste WebWorker NRW ist ';
        if (meetupDate.valueOf() === today.valueOf()) {
          speechOutput += 'heute. ';
        } else {
          speechOutput += 'am ' + meetupDate.getDate() + '.' + deMonths[meetupDate.getMonth()] + '. ';
        }

        speechOutput += 'Es wird ';
        const talkCount = meetup.talk.length;

        if (talkCount === 1) {
          const talk = meetup.talk[0];
          speechOutput += 'einen Talk von ' + formatSpeakers(talk.speaker) + ' zum Thema ';
          speechOutput += talk.title + ' geben. ';
        } else {
          speechOutput += talkCount + ' Talks.';
          let i = 0;
          for (const talk of meetup.talk) {
            i++;
            speechOutput += 'Der ' + i + '. Talk ist von ' + formatSpeakers(talk.speaker) + ' zum Thema ';
            speechOutput += talk.title + ' geben. ';
          }
        }
      }

      this.emit(":tell", speechOutput);
    })
    .catch(logError);
}

const handlers = {
  LaunchRequest: nextMeetUpWhenIntent,
  NextMeetupWhenIntent: nextMeetUpWhenIntent,
  NextMeetupTopicsIntent: function () {
    getNextMeetup()
      .then((meetup) => {
        const today = getToday();
        const meetupDate = meetup.date;
        let speechOutput = '';
        if (meetup.date > today) {
          speechOutput = 'Das nächste Meetup der Webworker NRW ist noch nicht angekündigt. Kommt aber bestimmt bald!';
        } else {
          speechOutput = 'Beim nächsten Webworker NRW wird es ';
          const talkCount = meetup.talk.length;

          if (talkCount === 1) {
            const talk = meetup.talk[0];
            speechOutput += 'einen Talk von ' + formatSpeakers(talk.speaker) + ' zum Thema ';
            speechOutput += talk.title + ' geben. ';
          } else {
            speechOutput += talkCount + ' Talks.';
            let i = 0;
            for (const talk of meetup.talk) {
              i++;
              speechOutput += 'Der ' + i + '. Talk ist von ' + formatSpeakers(talk.speaker) + ' zum Thema ';
              speechOutput += talk.title + ' geben. ';
            }
          }

          speechOutput += 'Es findet ';
          if (meetupDate.valueOf() === today.valueOf()) {
            speechOutput += 'heute';
          } else {
            speechOutput += 'am ' + meetupDate.getDate() + '.' + deMonths[meetupDate.getMonth()];
          }
          speechOutput += 'statt. ';
        }

        this.emit(":tell", speechOutput);
      })
      .catch(logError);
  },
  Unhandled: function () {
    let speechOutput = 'Das habe ich leider nicht verstanden. Frage mich wann das nächste Meetup ist.';
    this.emit(":tell", speechOutput);
  }
};

exports.handler = function(event, context, callback){
  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};