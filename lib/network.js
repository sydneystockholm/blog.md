var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils')
  , sift = require('sift');

/**
 * Create a new blog network.
 *
 * @param {Object} blogs (optional) - { name: Blog, ... }
 */

function Network(blogs) {
    this.blogs = {};
    this.loading = 0;
    this.length = 1;
    this.blog_names = [];
    blogs = blogs || {};
    for (var name in blogs) {
        this.add(name, blogs[name]);
    }
}

inherits(Network, EventEmitter);

exports.Network = Network;

Network.prototype.context = 'network';

/**
 * Add a blog to the network.
 *
 * @param {String} name
 * @param {Blog} blog
 */

Network.prototype.add = function (name, blog) {
    this.blogs[name] = blog;
    this.blog_names.push(name);
    var self = this;
    this.loading++;
    this.length++;
    blog.on('load', function () {
        if (!--self.loading) {
            self.emit('load');
        }
    });
    blog.on('error', function (err) {
        self.emit('error', err);
    });
};

/**
 * Get blog posts from all network blogs.
 *
 * @param {Object} options (optional)
 * @return {Array} posts
 */

var allowed_options = utils.createSet([
    'query', 'limit', 'offset', 'page', 'random', 'not', 'fill'
]);

Network.prototype.select = function (options) {
    options = options || {};
    for (var key in options) {
        if (!(key in allowed_options)) {
            throw new Error('Unknown select() option: ' + key);
        }
    }
    var posts = [], sifter = sift(options.query)
      , post, match, count = 0
      , offset = Number(options.offset)
      , limit = Number(options.limit)
      , selected_blog
      , positions = {}
      , self = this;
    if (options.page && limit) {
        offset = (Number(options.page) - 1) * limit;
    }
    var not = options.not;
    if (Array.isArray(not)) {
        not = utils.createSet(not);
    }
    if (offset < 0 || limit < 0) {
        return [];
    }
    function nextPost() {
        var latest;
        selected_blog = null;
        self.blog_names.forEach(function (blog) {
            var position = positions[blog] || (positions[blog] = 0)
              , post = self.blogs[blog].posts[position];
            if (!post || (latest && post.date < latest.date)) {
                return;
            }
            selected_blog = blog;
            latest = post;
        });
        if (selected_blog) {
            positions[selected_blog]++;
        }
        return latest;
    }
    while ((post = nextPost())) {
        if (not && (selected_blog in not || (selected_blog + ':' + post.id) in not)) {
            continue;
        }
        if (!options.query) {
            match = true;
        } else if (typeof post.match === 'function') {
            match = post.match(options.query);
        } else {
            match = sifter.test(post);
        }
        if (match) {
            if (offset) {
                offset--;
                continue;
            }
            post._blogmd_blog = selected_blog;
            posts.push(post);
            if (limit && ++count === limit) {
                break;
            }
        }
    }
    if (options.random) {
        limit = Number(options.limit) || posts.length;
        var random_posts = [], position, tmp;
        while (limit-- && posts.length) {
            position = Math.random() * posts.length | 0;
            if (position > 0) {
                tmp = posts[position];
                posts[position] = posts[0];
                posts[0] = tmp;
            }
            random_posts.push(posts.shift());
        }
        posts = random_posts;
    }
    if (options.fill && posts.length < limit) {
        not = not || {};
        posts.forEach(function (post) {
            not[post._blogmd_blog + ':' + post.id] = true;
        });
        posts = posts.concat(this.select({
            random: true
          , not: not
          , limit: limit - posts.length
        }));
    }
    return posts;
};

/**
 * Iterate over blogs.
 *
 * @param {Function} iterator
 */

Network.prototype.forEach = function (iterator) {
    for (var key in this.blogs) {
        iterator(this.blogs[key]);
    }
};

/**
 * Get the total number of posts that match the query.
 *
 * @param {Object} options (optional)
 * @return {Number} count
 */

Network.prototype.count = function (options) {
    return this.select(options).length;
};

