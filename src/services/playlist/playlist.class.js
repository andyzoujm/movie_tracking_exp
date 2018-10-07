/* eslint-disable no-unused-vars */
const google = require('googleapis');
const youtube = google.youtube('v3');
const _ = require('lodash');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  find (params) {
    return Promise.resolve([]);
  }

  get (id, params) {
    params = params.query;
    var videos = [];
    const self = this;
    return new Promise(function(resolve, reject) {
      function getPlaylist(pageToken) {
        youtube.playlistItems.list({
          key: self.options.apiKey,
          part: 'id,snippet',
          playlistId: id,
          maxResults: 50,
          pageToken: pageToken,
        }, (err, results) => {
          if (err) {
            reject(err);
          } else {
            videos = videos.concat(results.items);
            if (results.nextPageToken) {
              getPlaylist(results.nextPageToken);
            } else {
              let returnList = _.map(videos, sample => {
                return {videoId: sample.snippet.resourceId.videoId, title: sample.snippet.title};
              });

              returnList = _.sortBy(returnList, videoItem => {
                let matched_title_num = videoItem.title.match(/^([0-9]+)/g)[0];
                if (!matched_title_num) {
                  console.error(`title ${videoItem.title} does not start with a number`);
                  return reject(new Error('title ${videoItem.title} does not start with a number`'));
                }
                return Number(matched_title_num);
              });

              resolve({
                id, 
                results: returnList,
              });
            }
          }
        });
      }

      getPlaylist();
    });
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)));
    }

    return Promise.resolve(data);
  }

  update (id, data, params) {
    return Promise.resolve(data);
  }

  patch (id, data, params) {
    return Promise.resolve(data);
  }

  remove (id, params) {
    return Promise.resolve({ id });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
