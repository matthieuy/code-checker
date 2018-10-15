let hljs = require('highlight.js')

let vueHighlightJS = {}
vueHighlightJS.install = (Vue) => {
  Vue.directive('highlightjs', {
    deep: true,
    bind (el, binding) {
      // on first bind, highlight all targets
      let targets = el.querySelectorAll('code')
      let target
      let i

      for (i = 0; i < targets.length; i += 1) {
        target = targets[i]

        if (typeof binding.value === 'string') {
          // if a value is directly assigned to the directive, use this
          // instead of the element content.
          target.textContent = binding.value
        }

        hljs.highlightBlock(target)
        hljs.lineNumbersBlock(target)
      }
    },
    componentUpdated (el, binding) {
      // after an update, re-fill the content and then highlight
      let targets = el.querySelectorAll('code')
      let target
      let i

      for (i = 0; i < targets.length; i += 1) {
        target = targets[i]
        if (typeof binding.value === 'string') {
          target.textContent = binding.value
          hljs.highlightBlock(target)
          hljs.lineNumbersBlock(target)
        }
      }
    },
  })
}

(function (w, d) {
  let TABLE_NAME = 'hljs-ln'
  let LINE_NAME = 'hljs-ln-line'
  let CODE_BLOCK_NAME = 'hljs-ln-code'
  let NUMBERS_BLOCK_NAME = 'hljs-ln-numbers'
  let NUMBER_LINE_NAME = 'hljs-ln-n'
  let DATA_ATTR_NAME = 'data-line-number'
  let BREAK_LINE_REGEXP = /\r\n|\r|\n/g

  if (hljs) {
    hljs.initLineNumbersOnLoad = initLineNumbersOnLoad
    hljs.lineNumbersBlock = lineNumbersBlock

    addStyles()
  } else {
    w.console.error('highlight.js not detected!')
  }

  function addStyles () {
    let css = d.createElement('style')
    css.type = 'text/css'
    css.innerHTML = format(
      `.{0}{border-collapse:collapse}
      .{0} td{padding:0}
      .{1}:before{content:attr({2})}`,
      [
        TABLE_NAME,
        NUMBER_LINE_NAME,
        DATA_ATTR_NAME,
      ])
    d.getElementsByTagName('head')[0].appendChild(css)
  }

  function initLineNumbersOnLoad (options) {
    if (d.readyState === 'complete') {
      documentReady(options)
    } else {
      w.addEventListener('DOMContentLoaded', function () {
        documentReady(options)
      })
    }
  }

  function documentReady (options) {
    try {
      let blocks = d.querySelectorAll('code.hljs')

      for (let i in blocks) {
        if (blocks.hasOwnProperty(i)) {
          lineNumbersBlock(blocks[i], options)
        }
      }
    } catch (e) {
      w.console.error('LineNumbers error: ', e)
    }
  }

  function lineNumbersBlock (element, options) {
    if (typeof element !== 'object') return

    // define options or set default
    options = {
      singleLine: false,
    }

    // convert options
    let firstLineIndex = options.singleLine ? 0 : 1

    async(function () {
      duplicateMultilineNodes(element)

      element.innerHTML = addLineNumbersBlockFor(element, firstLineIndex)
    })
  }

  function addLineNumbersBlockFor (element, firstLineIndex) {
    let inputHtml = element.innerHTML
    let lines = getLines(inputHtml)

    // if last line contains only carriage return remove it
    if (lines[lines.length - 1] === '') {
      lines.pop()
    }

    firstLineIndex = element.getAttribute('data-line') - element.getAttribute('data-before')
    firstLineIndex = Math.max(0, Math.min(firstLineIndex, lines.length + element.getAttribute('data-line')))

    let html = ''
    for (let i = 0, l = lines.length; i < l; i++) {
      html += format(
        `<tr>\
            <td class="{0}">\
                <div class="{1} {2}" {3}="{5}"></div>\
            </td>\
            <td class="{4}">\
                <div class="{1}">{6}</div>\
            </td>\
        </tr>`,
        [
          NUMBERS_BLOCK_NAME,
          LINE_NAME,
          NUMBER_LINE_NAME,
          DATA_ATTR_NAME,
          CODE_BLOCK_NAME,
          i + 1 + firstLineIndex,
          lines[i].length > 0 ? lines[i] : ' ',
        ])
    }

    return format('<table class="{0}">{1}</table>', [ TABLE_NAME, html ])
  }

  function duplicateMultilineNodes (element) {
    let nodes = element.childNodes
    for (let node in nodes) {
      if (nodes.hasOwnProperty(node)) {
        let child = nodes[node]
        if (getLinesCount(child.textContent) > 0) {
          if (child.childNodes.length > 0) {
            duplicateMultilineNodes(child)
          } else {
            duplicateMultilineNode(child.parentNode)
          }
        }
      }
    }
  }

  function duplicateMultilineNode (element) {
    let className = element.className
    if (!/hljs-/.test(className)) {
      return
    }

    let lines = getLines(element.innerHTML)
    let result = ''
    for (let i = 0; i < lines.length; i++) {
      result += format('<span class="{0}">{1}</span>\n', [ className, lines[i] ])
    }

    element.innerHTML = result.trim()
  }

  function getLines (text) {
    if (text.length === 0) {
      return []
    }
    return text.split(BREAK_LINE_REGEXP)
  }

  function getLinesCount (text) {
    return (text.match(BREAK_LINE_REGEXP) || []).length
    // return (text.trim().match(BREAK_LINE_REGEXP) || []).length
  }

  function async (func) {
    w.setTimeout(func, 0)
  }

  function format (format, args) {
    return format.replace(/\{(\d+)\}/g, function (m, n) {
      return args[n] ? args[n] : m
    })
  }
}(window, document))

export default vueHighlightJS
