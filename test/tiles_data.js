var assert = require('assert')
const superagent = require('superagent')
const pbf = require('pbf')
const VectorTile = require('@mapbox/vector-tile').VectorTile

var testTile = function(prefix, z, x, y, status) {
  var path = '/data/' + prefix + '/' + z + '/' + x + '/' + y + '.pbf';
  it(path + ' returns ' + status, function(done) {
    var test = supertest(app).get(path);
    if (status) test.expect(status);
    if (status == 200) test.expect('Content-Type', /application\/x-protobuf/);
    test.end(done);
  });
};

var prefix = 'openmaptiles';

describe('Vector tiles', function() {
  describe('existing tiles', function() {
    testTile(prefix, 0, 0, 0, 200);
    testTile(prefix, 14, 8581, 5738, 200);
  });

  describe('non-existent requests return 4xx', function() {
    testTile('non_existent', 0, 0, 0, 404);
    testTile(prefix, -1, 0, 0, 404); // err zoom
  });

  describe('out of bounds requests return 204', function() {
    testTile(prefix, 20, 0, 0, 204); // zoom out of bounds
    testTile(prefix, 0, 1, 0, 204);
    testTile(prefix, 0, 0, 1, 204);

    testTile(prefix, 14, 0, 0, 204); // non existent tile
  })

  describe('tiles with selected content', function() {
    it('should return a tile with all layers / properties', function(done) {
      var test = supertest(app).get('/data/openmaptiles/' + 14 + '/' + 8581+ '/' + 5738 + '.pbf')
      test.expect(200)
      test.expect(function (res) {
        assert.equal(res.headers['content-length'], '146616')
      })
      test.end(done)
    })
    it('should return a tile without any layers', function(done) {
      var test = supertest(app).get('/data/openmaptiles/' + 14 + '/' + 8581+ '/' + 5738 + '.pbf?layers=test')
      test.expect(200)
      test.expect(function (res) {
        const tile = new VectorTile(new pbf(res.body))
        assert.equal(Object.keys(tile.layers).length, 0)
        assert.equal(res.headers['content-length'], '20')
      })
      test.end(done)
    })
    it('should return a tile without some layers', function(done) {
      var test = supertest(app).get('/data/openmaptiles/' + 14 + '/' + 8581+ '/' + 5738 + '.pbf?layers=water')
      test.expect(200)
      .buffer(true).parse(superagent.parse.image)
      test.expect(function (res) {
        const tile = new VectorTile(new pbf(res.body))
        assert.equal(Object.keys(tile.layers).length, 1)
        assert.equal(res.headers['content-length'], '396')
      })
      test.end(done)
    })
    it('should return a tile without some layers and properties', function(done) {
      var test = supertest(app).get('/data/openmaptiles/' + 14 + '/' + 8581+ '/' + 5738 + '.pbf?layers=water&properties=test')
      test.expect(200)
      .buffer(true).parse(superagent.parse.image)
      test.expect(function (res) {
        const tile = new VectorTile(new pbf(res.body))
        assert.equal(Object.keys(tile.layers).length, 1)
        assert.equal(res.headers['content-length'], '373')
      })
      test.end(done)
    })
  });
});
