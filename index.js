const _ = require('lodash/fp')
const postCss = require('postcss')

const postCssWrapperPlugin = postCss.plugin(
  'postcss-wrapper-plugin',
  (prefix, exclude) =>
    function(css) {
      css.walkRules(rule => {
        if (_.isEqual(_.get('parent.name', rule), 'keyframes')) return

        const selector = rule.selector
        if (!selector.match(exclude))
          rule.selector = _.pipe(
            _.split(','),
            _.map(_.pipe(_.trim, joinPrefix(prefix))),
            _.join(', ')
          )(selector)
      })
    }
)

const joinPrefix = function(prefix) {
  return function(selector) {
    return _.join(' ', [prefix, selector])
  }
}

function PostCssWrapper(file, container, exclude) {
  this.file = file
  this.container = container
  this.exclude = exclude
}

PostCssWrapper.prototype.apply = function(compiler) {
  const file = this.file
  const container = this.container
  const exclude = this.exclude

  compiler.plugin('emit', (compilation, callback) => {
    const assets = compilation.assets
    if (!_.has(file, assets)) return callback()
    const source = assets[file].source()
    const processor = postCss([postCssWrapperPlugin(container, exclude)])

    processor.process(source).then(result => {
      compilation.assets[file] = {
        source() {
          return result.css
        },
        size() {
          return result.css.length
        },
      }
      callback()
    }, callback)
  })
}

module.exports = PostCssWrapper
