var assert = require('assert')
  , Blog = require('../lib/blog').Blog
  , Network = require('../lib/network').Network;

describe('Network', function () {

    it('should propagate blog loading errors', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
        ]));
        network.add('barblog', new Blog([
            { id: 2, title: 'a' /* missing date */ }
        ]));
        network.on('error', function () {
            done();
        });
    });

    it('should select posts aggregated from all blogs', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select();
            assert.equal(network.context, 'network');
            assert.equal(posts.length, 6);
            assert.equal(posts[0].title, 'c');
            assert.equal(posts[1].title, 'bar');
            assert.equal(posts[2].title, 'b');
            assert.equal(posts[3].title, 'foo');
            assert.equal(posts[4].title, 'a');
            assert.equal(posts[5].title, 'foo');
            assert.equal(network.count(), 6);
            done();
        });
    });

    it('should select posts while respecting a limit and offset parameter', function (done) {
        var network = new Network({
            fooblog: new Blog([
                { id: 1, title: 'foo', date: '2012-10-01' }
              , { id: 2, title: 'foo', date: '2012-10-03' }
              , { id: 3, title: 'bar', date: '2012-10-05' }
            ]),
            barblog: new Blog([
                { id: 1, title: 'a', date: '2012-10-02' }
              , { id: 2, title: 'b', date: '2012-10-04' }
              , { id: 3, title: 'c', date: '2012-10-06' }
            ])
        });
        network.on('load', function () {
            var posts = network.select({ limit: 3, offset: 1 });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'b');
            assert.equal(posts[2].title, 'foo');
            posts = network.select({ limit: '3', offset: '1' });
            assert.equal(posts.length, 3);
            done();
        });
    });

    it('should handle bad input', function (done) {
        var network = new Network({
            fooblog: new Blog([
                { id: 1, title: 'foo', date: '2012-10-01' }
              , { id: 2, title: 'foo', date: '2012-10-03' }
              , { id: 3, title: 'bar', date: '2012-10-05' }
            ]),
            barblog: new Blog([
                { id: 1, title: 'a', date: '2012-10-02' }
              , { id: 2, title: 'b', date: '2012-10-04' }
              , { id: 3, title: 'c', date: '2012-10-06' }
            ])
        });
        network.on('load', function () {
            assert.equal(network.select({ limit: 3, offset: -1 }).length, 0);
            assert.equal(network.select({ limit: -3, offset: 1 }).length, 0);
            assert.equal(network.select({ limit: 3, page: -1 }).length, 0);
            done();
        });
    });

    it('should select posts while respecting a limit and offset parameter', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 4, title: 'a', date: '2012-10-02' }
          , { id: 5, title: 'b', date: '2012-10-04' }
          , { id: 6, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ limit: 3, page: 2 });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].id, 2);
            assert.equal(posts[1].id, 4);
            assert.equal(posts[2].id, 1);
            done();
        });
    });

    it('should select posts while respecting a limit and offset parameter', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foobar', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ offset: 1 });
            assert.equal(posts.length, 5);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'b');
            assert.equal(posts[2].title, 'foo');
            assert.equal(posts[3].title, 'a');
            assert.equal(posts[4].title, 'foobar');
            done();
        });
    });

    it('should select posts using a query', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01', category: 'bar' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04', category: 'bar' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ query: { category: 'bar' }});
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'b');
            assert.equal(posts[1].title, 'foo');
            posts.forEach(function (post) {
                assert.equal(post.category, 'bar');
            });
            assert.equal(network.count({ query: { category: 'bar' }}), 2);
            done();
        });
    });

    it('should use post.match() if available', function (done) {
        function match(category) {
            return this.category === category;
        }
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-05', category: 'bar', match: match }
          , { id: 2, title: 'bar', date: '2012-10-03', category: 'bar', match: match }
          , { id: 3, title: 'baz', date: '2012-10-01', category: 'foo', match: match }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-06', category: 'foobar', match: match }
          , { id: 2, title: 'b', date: '2012-10-04', category: 'bar', match: match }
          , { id: 3, title: 'c', date: '2012-10-02', category: 'foobar', match: match }
        ]));
        network.on('load', function () {
            var posts = network.select({ query: 'bar' });
            assert(Array.isArray(posts));
            assert.equal(posts.length, 3);
            assert.equal(posts[0].title, 'foo');
            assert.equal(posts[1].title, 'b');
            assert.equal(posts[2].title, 'bar');
            done();
        });
    });

    it('should throw an error if an unknown select() option is passed', function () {
        assert.throws(function () {
            Network.prototype.select({ foo: 'bar' });
        });
    });

    it('should select posts aggregated from all blogs, sorted randomly', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ random: true });
            assert.equal(posts.length, 6);
            done();
        });
    });

    it('should let the user exclude posts', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ not: [ 'barblog:3' ], limit: 1 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].title, 'bar');
            posts = network.select({ not: { 'barblog:3': true }, limit: 1 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].title, 'bar');
            done();
        });
    });

    it('should let the user exclude blogs', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ not: [ 'barblog' ], limit: 2 });
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'foo');
            posts = network.select({ not: { 'barblog': true }, limit: 2 });
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'foo');
            done();
        });
    });

    it('should let the user fill the remaining slots with random posts', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'bar', date: '2012-10-05' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-02' }
          , { id: 2, title: 'b', date: '2012-10-04' }
          , { id: 3, title: 'c', date: '2012-10-06' }
        ]));
        network.on('load', function () {
            var posts = network.select({ query: { title: 'bar' }, limit: 6 });
            assert.equal(posts.length, 1);
            posts = network.select({ query: { title: 'bar' }, limit: 6, fill: true });
            assert.equal(posts.length, 6);
            var seen = {};
            posts.forEach(function (post) {
                var id = post.id + ':' + post.title;
                assert(!(id in seen));
                seen[id] = true;
            });
            done();
        });
    });

    it('should provide a way to cycle blogs fairly', function (done) {
        var network = new Network();
        network.add('fooblog', new Blog([
            { id: 1, title: 'a', date: '2012-10-01' }
          , { id: 2, title: 'b', date: '2012-10-03' }
        ]));
        network.add('barblog', new Blog([
            { id: 1, title: 'c', date: '2012-10-05' }
          , { id: 2, title: 'd', date: '2012-10-06' }
        ]));
        network.add('quxblog', new Blog([
            { id: 1, title: 'e', date: '2012-10-04' }
          , { id: 2, title: 'f', date: '2012-10-08' }
        ]));
        var posts;
        network.on('load', function () {
            posts = network.select({ limit: 8, distinct: true });
            assert.equal(posts.length, 6);
            assert.equal(posts[0].title, 'f');
            assert.equal(posts[1].title, 'd');
            assert.equal(posts[2].title, 'b');
            assert.equal(posts[3].title, 'c');
            assert.equal(posts[4].title, 'e');
            assert.equal(posts[5].title, 'a');

            posts = network.select({ distinct: true });
            assert.equal(posts.length, 6);

            posts = network.select({ limit: 3, not: ['quxblog'], distinct: true, offset: 1 });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].title, 'b');
            assert.equal(posts[1].title, 'c');
            assert.equal(posts[2].title, 'a');

            posts = network.select({ limit: 3, not: { quxblog: true }, distinct: true });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].title, 'd');
            assert.equal(posts[1].title, 'b');
            assert.equal(posts[2].title, 'c');

            posts = network.select({ limit: 3, not: { quxblog: true }, distinct: true, page: 2 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].title, 'a');

            posts = network.select({ limit: 3, not: { quxblog: true }, distinct: true, page: 3 });
            assert.equal(posts.length, 0);

            assert.equal(network.select({ limit: -1, distinct: true }).length, 0);

            done();
        });
    });

});

