var assert = require('assert')
  , Blog = require('../lib/blog').Blog
  , StopIteration = require('../lib/blog').StopIteration
  , ArrayLoader = require('../lib/loaders/array').ArrayLoader
  , EventEmitter = require('events').EventEmitter;

function isSorted(posts) {
    for (var i = 1; i < posts.length; i++) {
        if (posts[i].date > posts[i - 1].date) {
            return false;
        }
    }
    return true;
}

describe('Blog', function () {

    it('should parse post dates', function (done) {
        var blog = new Blog([
            { title: 'foo', date: '2012-10-01' }
        ]);
        blog.on('load', function () {
            var post = blog.post('foo');
            assert.equal(blog.context, 'blog');
            assert(post.date instanceof Date);
            assert.equal(post.date.getTime(), new Date('2012-10-01').getTime());
            done();
        });
    });

    it('should give posts a default title', function (done) {
        var blog = new Blog([
            { id: 1, date: '2012-10-01' }
        ]);
        blog.on('load', function () {
            var post = blog.posts[0];
            assert.equal(post.title, 'Untitled');
            assert.equal(post.slug, 'untitled');
            done();
        });
    });

    it('should verify that post ids are unique', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 1, title: 'foo', date: '2012-10-01' }
        ]);
        blog.on('error', function () {
            done();
        });
    });

    it('should verify that posts have a date', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo' }
        ]);
        blog.on('error', function () {
            done();
        });
    });

    it('should verify that posts have a valid date', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: 'foo' }
        ]);
        blog.on('error', function () {
            done();
        });
    });

    it('should give posts a unique slug', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'foo', date: '2012-10-03' }
        ]);
        blog.on('load', function () {
            var post = blog.post('foo');
            assert.equal(new Date('2012-10-01').getTime(), post.date.getTime());
            post = blog.post('foo-2');
            assert.equal(new Date('2012-10-02').getTime(), post.date.getTime());
            post = blog.post('foo-3');
            assert.equal(new Date('2012-10-03').getTime(), post.date.getTime());
            var posts = blog.select();
            assert(isSorted(posts));
            done();
        });
    });

    it('should skip slug generation if slugs already exist', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01', slug: 'foo-1' }
          , { id: 2, title: 'foo', date: '2012-10-02', slug: 'foo-2' }
          , { id: 3, title: 'foo', date: '2012-10-03', slug: 'foo-3' }
        ]);
        blog.on('load', function () {
            var post = blog.post('foo-1');
            assert.equal(new Date('2012-10-01').getTime(), post.date.getTime());
            post = blog.post('foo-2');
            assert.equal(new Date('2012-10-02').getTime(), post.date.getTime());
            post = blog.post('foo-3');
            assert.equal(new Date('2012-10-03').getTime(), post.date.getTime());
            var posts = blog.select();
            assert(isSorted(posts));
            done();
        });
    });

    it('should sort posts when no slugs need to be generated', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-03', slug: 'foo-1' }
          , { id: 2, title: 'foo', date: '2012-10-01', slug: 'foo-2' }
          , { id: 3, title: 'foo', date: '2012-10-02', slug: 'foo-3' }
        ]);
        blog.on('load', function () {
            var post = blog.post('foo-1');
            assert.equal(new Date('2012-10-03').getTime(), post.date.getTime());
            post = blog.post('foo-2');
            assert.equal(new Date('2012-10-01').getTime(), post.date.getTime());
            post = blog.post('foo-3');
            assert.equal(new Date('2012-10-02').getTime(), post.date.getTime());
            var posts = blog.select();
            assert(isSorted(posts));
            done();
        });
    });

    it('should sort the posts when slugs need to be generated', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-03' }
          , { id: 2, title: 'foo', date: '2012-10-01' }
          , { id: 3, title: 'foo', date: '2012-10-02' }
        ]);
        blog.on('load', function () {
            var post = blog.post('foo-3');
            assert.equal(new Date('2012-10-03').getTime(), post.date.getTime());
            post = blog.post('foo-2');
            assert.equal(new Date('2012-10-02').getTime(), post.date.getTime());
            post = blog.post('foo');
            assert.equal(new Date('2012-10-01').getTime(), post.date.getTime());
            var posts = blog.select();
            assert(isSorted(posts));
            done();
        });
    });

    it('should select posts', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'bar', date: '2012-10-03' }
          , { id: 4, title: 'baz', date: '2012-10-04' }
        ]);
        blog.on('load', function () {
            var posts = blog.select();
            assert.equal(posts.length, 4);
            assert.equal(posts[0].title, 'baz');
            assert.equal(posts[1].title, 'bar');
            assert.equal(posts[2].title, 'foo');
            assert.equal(posts[3].title, 'foo');
            done();
        });
    });

    it('should select posts while respecting a limit and offset parameter', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foobar', date: '2012-10-01', category: 'foo' }
          , { id: 2, title: 'foo', date: '2012-10-02', category: 'foo' }
          , { id: 3, title: 'bar', date: '2012-10-03', category: 'bar' }
          , { id: 4, title: 'baz', date: '2012-10-04', category: 'bar' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ limit: 2, offset: 1 });
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'foo');
            posts = blog.select({ limit: '2', offset: '1' });
            assert.equal(posts.length, 2);
            posts = blog.select({ query: { category: 'foo' }, limit: 1, offset: 1 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].title, 'foobar');
            posts = blog.select({ limit: 1 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].title, 'baz');
            done();
        });
    });

    it('should handle bad input', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foobar', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'bar', date: '2012-10-03' }
          , { id: 4, title: 'baz', date: '2012-10-04' }
        ]);
        blog.on('load', function () {
            assert.equal(blog.select({ limit: -10 }).length, 0);
            assert.equal(blog.select({ limit: 10, page: -1 }).length, 0);
            assert.equal(blog.select({ limit: 10, offset: -1 }).length, 0);
            done();
        });
    });

    it('should select posts while respecting a limit and page parameter', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foobar', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'bar', date: '2012-10-03' }
          , { id: 4, title: 'baz', date: '2012-10-04' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ limit: 2, page: 2 });
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'foo');
            assert.equal(posts[1].title, 'foobar');
            done();
        });
    });

    it('should provide a way to get the number of matched posts', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-02' }
          , { id: 2, title: 'foo', date: '2012-10-03' }
          , { id: 3, title: 'baz', date: '2012-10-04' }
        ]);
        blog.on('load', function () {
            assert.equal(blog.count(), 3);
            assert.equal(blog.count({ query: { title: 'foo' } }), 2);
            done();
        });
    });

    it('should select posts while respecting an offset parameter', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foobar', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'bar', date: '2012-10-03' }
          , { id: 4, title: 'baz', date: '2012-10-04' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ offset: 1 });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'foo');
            assert.equal(posts[2].title, 'foobar');
            done();
        });
    });

    it('should select posts using a query', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01', category: 'bar' }
          , { id: 2, title: 'foo', date: '2012-10-02', category: 'foo' }
          , { id: 3, title: 'bar', date: '2012-10-03', category: 'bar' }
          , { id: 4, title: 'baz', date: '2012-10-04', category: 'baz' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ query: { category: 'bar' }});
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'bar');
            assert.equal(posts[1].title, 'foo');
            posts.forEach(function (post) {
                assert.equal(post.category, 'bar');
            });
            done();
        });
    });

    it('should load from the file system when a string is passed to the constructor', function (done) {
        var blog = new Blog(__dirname + '/data/blog2');
        blog.on('load', function () {
            var post1 = blog.post('post1');
            assert.equal(post1.title, 'post1');
            assert(post1.date instanceof Date);
            assert.equal(post1.date.getTime(), new Date('2012-10-01').getTime());
            var post2 = blog.post('post2');
            assert.equal(post2.title, 'post2');
            assert(post2.date instanceof Date);
            assert.equal(post2.date.getTime(), new Date('2012-10-02').getTime());
            done();
        });
    });

    it('should maintain an internal linked list to get prev/next posts', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo1', date: '2012-10-01', category: 'bar' }
          , { id: 2, title: 'foo2', date: '2012-10-02', category: 'foobar' }
          , { id: 3, title: 'bar1', date: '2012-10-03', category: 'foobar' }
          , { id: 4, title: 'bar2', date: '2012-10-04', category: 'baz' }
        ]);
        blog.on('load', function () {
            var posts = blog.select();
            assert.equal(posts[0].title, 'bar2');
            assert.equal(posts[0].prev, null);
            assert.equal(posts[0].next.title, 'bar1');
            assert.equal(posts[1].title, 'bar1');
            assert.equal(posts[1].prev.title, 'bar2');
            assert.equal(posts[1].next.title, 'foo2');
            assert.equal(posts[2].title, 'foo2');
            assert.equal(posts[2].prev.title, 'bar1');
            assert.equal(posts[2].next.title, 'foo1');
            assert.equal(posts[3].title, 'foo1');
            assert.equal(posts[3].prev.title, 'foo2');
            assert.equal(posts[3].next, null);
            done();
        });
    });

    it('should support random selection of posts', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo1', date: '2012-10-01', category: 'bar', tag: 'foo' }
          , { id: 2, title: 'foo2', date: '2012-09-01', category: 'bar', tag: 'bar' }
          , { id: 3, title: 'foo3', date: '2012-08-01', category: 'foo', tag: 'bar' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ query: { category: 'bar' }, limit: 1, random: true });
            assert(Array.isArray(posts));
            assert.equal(posts.length, 1);
            assert(posts[0].title === 'foo1' || posts[0].title === 'foo2');
            posts = blog.select({ query: { category: 'bar' }, random: true });
            assert(Array.isArray(posts));
            assert.equal(posts.length, 2);
            done();
        });
    });

    it('should use post.match() if available', function (done) {
        function match(category) {
            return this.category === category;
        }
        var blog = new Blog([
            { id: 1, title: 'foo1', date: '2012-10-01', category: 'bar', match: match }
          , { id: 2, title: 'foo2', date: '2012-09-01', category: 'bar', match: match }
          , { id: 3, title: 'foo3', date: '2012-08-01', category: 'foo', match: match }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ query: 'bar' });
            assert(Array.isArray(posts));
            assert.equal(posts[0].title, 'foo1');
            assert.equal(posts[1].title, 'foo2');
            assert.equal(blog.count({ query: 'bar' }), 2);
            done();
        });
    });

    it('should respect StopIteration when using post.match()', function (done) {
        var i = 0;
        function match() {
            if (++i === 3) {
                throw new StopIteration();
            }
            return true;
        }
        var blog = new Blog([
            { id: 1, title: 'foo1', date: '2012-10-01', category: 'bar', match: match }
          , { id: 2, title: 'foo2', date: '2012-09-01', category: 'bar', match: match }
          , { id: 3, title: 'foo3', date: '2012-08-01', category: 'bar', match: match }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ query: { category: 'bar' } });
            assert(Array.isArray(posts));
            assert.equal(posts.length, 2);
            assert.equal(posts[0].title, 'foo1');
            done();
        });
    });

    it('should propagate errors form within post.match()', function (done) {
        function match() {
            throw new Error();
        }
        var blog = new Blog([
            { id: 1, title: 'foo1', date: '2012-10-01', category: 'bar', match: match }
          , { id: 2, title: 'foo2', date: '2012-09-01', category: 'bar', match: match }
          , { id: 3, title: 'foo3', date: '2012-08-01', category: 'bar', match: match }
        ]);
        blog.on('load', function () {
            assert.throws(function () {
                blog.select({ query: { category: 'bar' } });
            });
            done();
        });
    });

    it('should propagate errors emitted by the loader', function (done) {
        var loader = new ArrayLoader([])
          , blog = new Blog(loader);
        blog.on('error', function () {
            done();
        });
        loader.emit('error', new Error());
    });

    it('should listen for new posts', function (done) {
        var posts = [
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'foo', date: '2012-10-03' }
        ];
        var loader = new ArrayLoader(posts)
          , blog = new Blog(loader);
        blog.on('load', function () {
            var posts = blog.select();
            assert.equal(posts.length, 3);
            assert(isSorted(posts));
            loader.emit('new_post', { id: 4, title: 'bar', date: '2012-10-04' });
            posts = blog.select();
            assert.equal(posts.length, 4);
            assert(isSorted(posts));
            assert.equal(blog.post('bar').title, 'bar');
            assert.equal(blog.count(), 4);
            loader.emit('new_post', { id: 5, title: 'baz', date: '2012-10-02' });
            posts = blog.select();
            assert.equal(posts.length, 5);
            assert(isSorted(posts));
            assert.equal(blog.post('baz').title, 'baz');
            assert.equal(blog.count(), 5);
            done();
        });
    });

    it('should fail if a new post is missing fields', function (done) {
        var loader = new ArrayLoader([])
          , blog = new Blog(loader);
        blog.on('load', function () {
            loader.emit('new_post', { id: 2 });
        });
        blog.on('error', function () {
            done();
        });
    });

    it('should fail if a new post is missing an id', function (done) {
        var loader = new ArrayLoader([])
          , blog = new Blog(loader);
        blog.on('load', function () {
            loader.emit('new_post', { title: 'Foobar', adte: '2012-10-10' });
        });
        blog.on('error', function () {
            done();
        });
    });

    it('should fail if a new post has duplicate id', function (done) {
        var loader = new ArrayLoader([
            { id: 1, title: 'foo', date: '2012-10-01' }
        ]);
        var blog = new Blog(loader);
        blog.on('load', function () {
            loader.emit('new_post', { id: 1, title: 'foo', date: '2012-10-10' });
        });
        blog.on('error', function () {
            done();
        });
    });

    it('should remove posts', function (done) {
        var posts = [
            { id: 1, title: 'foo', date: '2012-10-01' }
          , { id: 2, title: 'foo', date: '2012-10-02' }
          , { id: 3, title: 'foo', date: '2012-10-03' }
        ];
        var loader = new ArrayLoader(posts)
          , blog = new Blog(loader);
        blog.on('load', function () {
            var posts = blog.select();
            assert.equal(posts.length, 3);
            assert(isSorted(posts));
            assert.equal(blog.count(), 3);
            loader.emit('removed_post', { id: 2, title: 'foo', date: '2012-10-02' });
            posts = blog.select();
            assert.equal(posts.length, 2);
            assert(isSorted(posts));
            assert(!blog.post('foo-2'));
            var post = blog.post('foo');
            assert.equal(post.id, 1);
            assert.equal(post.next, null);
            assert.equal(post.prev.id, 3);
            assert.equal(post.prev.next.id, 1);
            assert.equal(post.prev.prev, null);
            assert.equal(blog.count(), 2);
            loader.emit('removed_post', { id: 1, title: 'foo', date: '2012-10-01' });
            posts = blog.select();
            assert.equal(posts.length, 1);
            assert(isSorted(posts));
            assert(!blog.post('foo'));
            post = blog.post('foo-3');
            assert.equal(post.id, 3);
            assert.equal(post.next, null);
            assert.equal(post.prev, null);
            assert.equal(blog.count(), 1);
            done();
        });
    });

    it('should update posts', function (done) {
        var posts = [
            { id: 1, title: 'Foo', date: '2012-10-01' }
        ];
        var loader = new ArrayLoader(posts)
          , blog = new Blog(loader);
        blog.on('load', function () {
            var post = blog.post('foo');
            assert.equal(post.id, 1);
            assert.equal(post.title, 'Foo');
            assert.equal(post.slug, 'foo');
            loader.emit('updated_post', { id: 1, title: 'Bar', date: '2012-10-01' });
            post = blog.post('bar');
            assert(!blog.post('foo'));
            assert.equal(post.id, 1);
            assert.equal(post.title, 'Bar');
            assert.equal(post.slug, 'bar');
            assert.equal(blog.count(), 1);
            done();
        });
    });

    it('should provide a way to fill results with random posts', function (done) {
        var blog = new Blog([
            { id: 1, title: 'foo', date: '2012-10-01', category: 'foo' }
          , { id: 2, title: 'foo', date: '2012-10-01' }
          , { id: 3, title: 'foo', date: '2012-10-01' }
        ]);
        blog.on('load', function () {
            var posts = blog.select({ query: { category: 'foo' }, limit: 2 });
            assert.equal(posts.length, 1);
            assert.equal(posts[0].id, 1);
            posts = blog.select({ query: { category: 'foo' }, limit: 2, fill: true });
            assert.equal(posts.length, 2);
            assert(posts[0].id, 1);
            assert(posts[1].id === 2 || posts[1].id === 3);

            posts = blog.select({ query: { category: 'foo' }, limit: 2, fill: true, not: [ 1 ] });
            assert.equal(posts.length, 2);
            assert(posts[0].id === 2 || posts[0].id === 3);
            assert(posts[1].id === 2 || posts[1].id === 3);
            assert(posts[0].id !== posts[1].id);
            posts = blog.select({ query: { category: 'foo' }, limit: 2, fill: true, not: 1 });
            assert.equal(posts.length, 2);
            assert(posts[0].id === 2 || posts[0].id === 3);
            assert(posts[1].id === 2 || posts[1].id === 3);
            assert(posts[0].id !== posts[1].id);
            posts = blog.select({ query: { category: 'foo' }, limit: 2, fill: true, not: { 1: true } });
            assert.equal(posts.length, 2);
            assert(posts[0].id === 2 || posts[0].id === 3);
            assert(posts[1].id === 2 || posts[1].id === 3);
            assert(posts[0].id !== posts[1].id);

            posts = blog.select({ query: { category: 'foo' }, limit: 3, fill: true });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].id, 1);
            assert(posts[1].id === 2 || posts[1].id === 3);
            assert(posts[2].id === 2 || posts[2].id === 3);
            posts = blog.select({ query: { category: 'foo' }, limit: 4, fill: true });
            assert.equal(posts.length, 3);
            assert.equal(posts[0].id, 1);
            assert(posts[1].id === 2 || posts[1].id === 3);
            assert(posts[2].id === 2 || posts[2].id === 3);
            done();
        });
    });

    it('should throw an error if an unknown select() option is passed', function () {
        assert.throws(function () {
            Blog.prototype.select({ foo: 'bar' });
        });
    });

    it('should provide a next/prev link on each post', function () {
        var source = new EventEmitter()
          , blog = new Blog(source);
        source.emit('new_post', { id: 1, title: 'Foo', date: new Date('2013-06-15') });
        assert.equal(blog.posts[0].id, 1);
        assert(!blog.posts[0].next && !blog.posts[0].prev);
        source.emit('new_post', { id: 2, title: 'Bar', date: new Date('2013-06-13') });
        assert.equal(blog.posts[0].id, 1);
        assert.equal(blog.posts[1].id, 2);
        assert.equal(blog.posts[0].next.id, 2);
        assert.equal(blog.posts[1].prev.id, 1);
        assert(!blog.posts[1].next && !blog.posts[0].prev);
        source.emit('new_post', { id: 3, title: 'Baz', date: new Date('2013-07-13') });
        assert.equal(blog.posts[0].id, 3);
        assert.equal(blog.posts[1].id, 1);
        assert.equal(blog.posts[2].id, 2);
        assert(!blog.posts[2].next && !blog.posts[0].prev);
        assert.equal(blog.posts[0].next.id, 1);
        assert.equal(blog.posts[1].next.id, 2);
        assert.equal(blog.posts[2].prev.id, 1);
        assert.equal(blog.posts[1].prev.id, 3);
        source.emit('new_post', { id: 4, title: 'Qux', date: new Date('2013-06-14') });
        assert.equal(blog.posts[0].id, 3);
        assert.equal(blog.posts[1].id, 1);
        assert.equal(blog.posts[2].id, 4);
        assert.equal(blog.posts[3].id, 2);
        assert(!blog.posts[3].next && !blog.posts[0].prev);
        assert.equal(blog.posts[0].next.id, 1);
        assert.equal(blog.posts[1].next.id, 4);
        assert.equal(blog.posts[2].next.id, 2);
        assert.equal(blog.posts[3].prev.id, 4);
        assert.equal(blog.posts[2].prev.id, 1);
        assert.equal(blog.posts[1].prev.id, 3);
        source.emit('updated_post', { id: 4, title: 'Fooqux', date: new Date('2013-06-14') });
        assert.equal(blog.posts[1].next.title, 'Fooqux');
        assert.equal(blog.posts[3].prev.title, 'Fooqux');
        assert.equal(blog.posts[2].prev.next.title, 'Fooqux');
        assert.equal(blog.posts[2].next.prev.title, 'Fooqux');
        source.emit('removed_post', { id: 4 });
        assert.equal(blog.posts[0].id, 3);
        assert.equal(blog.posts[1].id, 1);
        assert.equal(blog.posts[2].id, 2);
        assert(!blog.posts[2].next && !blog.posts[0].prev);
        assert.equal(blog.posts[0].next.id, 1);
        assert.equal(blog.posts[1].next.id, 2);
        assert.equal(blog.posts[2].prev.id, 1);
        assert.equal(blog.posts[1].prev.id, 3);
    });

});

