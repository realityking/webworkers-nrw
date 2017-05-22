'use strict';

const Metalsmith = require('metalsmith');
const contentful = require('contentful-metalsmith');
const layouts = require('metalsmith-layouts');
const assets = require('metalsmith-assets');
const Handlebars = require('handlebars');
const moment = require('moment');

moment.locale('de');

Handlebars.registerHelper('dateFormat', function(context, block) {
  let f = block.hash.format || "MMM DD, YYYY hh:mm:ss A";
  return moment(context).format(f);
});

Metalsmith(__dirname)
  .source('src')
  .destination('build')
  .use(contentful({
    space_id: 'euawp8ua75m5',
    access_token: '8b1f335f043615e20e37e3fa362b39e7c09e10cfaffcebb057078f5fb1368839',
    common: {
      mainPageConfig: {
        content_type: 'mainPageConfig',
        limit: 1
      },
      nextMeetup: {
        content_type: 'meetup',
        order: '-fields.date',
        include: 2,
        limit: 1
      }
    }
  }))
  .use(layouts({
    engine: 'handlebars',
    partials: 'partials'
  }))
  .use(assets({
    source: 'assets/',
    destination: 'assets/'
  }))
  .build(function (err) {
    if (err) {
      throw err;
    }

    console.log('Successfully build metalsmith');
  });