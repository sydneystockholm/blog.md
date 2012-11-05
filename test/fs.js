var assert = require('assert')
  , FileSystemLoader = require('../').FileSystemLoader;

describe('File System Loader', function () {

    it('should parse metadata blocks', function (done) {
        var block = 'title: foo\n' +
                    'some.nested.obj.foo: a\n' +
                    'some.nested.obj.bar: b\n' +
                    'categories: [ foo, bar, baz ]';
        var meta = new FileSystemLoader(__dirname + '/data/blog1').parseMetadata(block);
        assert.deepEqual(meta, {
            title: 'foo'
          , some: { nested: { obj: { foo: 'a', bar: 'b' } } }
          , categories: [ 'foo', 'bar', 'baz' ]
        });
        done();
    });

    it('should fail on an unknown format', function (done) {
        var loader = new FileSystemLoader(__dirname + '/data/blog1');
        loader.load(function (err) {
            assert(err);
            done();
        });
    });

    it('should load blog metadata', function (done) {
        var loader = new FileSystemLoader(__dirname + '/data/blog2')
          , pushed = false;
        loader.push = function (posts, blog) {
            pushed = true;
            assert.equal(blog.foo, 'bar');
            assert.equal(blog.name, 'My blog');
        };
        loader.load(function (err, blog) {
            assert(!err, err);
            assert(pushed);
            done();
        });
    });

    it('should parse markdown files', function (done) {
        var loader = new FileSystemLoader(__dirname + '/data/blog2')
          , pushed = false;
        loader.push = function (posts, blog) {
            pushed = true;
            var post1 = __dirname + '/data/blog2/a/post1.md'
              , post2 = __dirname + '/data/blog2/b/post2.md';
            assert.equal(2, Object.keys(posts).length);
            assert(post1 in posts);
            assert(post2 in posts);
            assert.equal('post1', posts[post1].title);
            assert.equal('post2', posts[post2].title);
            assert.equal('bar', posts[post1].foo);
            assert.equal('baz', posts[post2].foo);
            var html = '<p>The <em>quick</em> brown fox jumped over the <strong>lazy</strong> dog</p>';
            assert.equal(html, posts[post1].body);
            assert.equal(html, posts[post2].body);
        };
        loader.load(function (err) {
            assert(!err, err);
            assert(pushed);
            done();
        });
    });

    it('should parse html files', function (done) {
        var loader = new FileSystemLoader(__dirname + '/data/blog3')
          , pushed = false;
        loader.push = function (posts, blog) {
            pushed = true;
            var post1 = __dirname + '/data/blog3/a/post1.html'
              , post2 = __dirname + '/data/blog3/b/post2.html';
            assert.equal(2, Object.keys(posts).length);
            assert(post1 in posts);
            assert(post2 in posts);
            assert.equal('post1', posts[post1].title);
            assert.equal('post2', posts[post2].title);
            assert.equal('bar', posts[post1].foo);
            assert.equal('baz', posts[post2].foo);
            var html = '<p>The <em>quick</em> brown fox jumped over the <strong>lazy</strong> dog</p>';
            assert.equal(html, posts[post1].body);
            assert.equal(html, posts[post2].body);
        };
        loader.load(function (err, blog) {
            assert(!err, err);
            assert(pushed);
            done();
        });
    });

    it('should detect new blog posts and push automatically');

    it('should push changes to blog posts');

    it('should detect when a blog post is removed');

    it('should detect changes to blog metadata');

});

