export function sanitize(input) {
  if (!input) return ''
  if (typeof input !== 'string') return ''

  let output = input

  output = output.replace(/<script>/gi, '')
  output = output.replace(/<\/script>/gi, '')

  output = output.replace(/on\w+=/gi, '')

  output = output.replace(/<iframe/gi, '')
  output = output.replace(/<\/iframe>/gi, '')

  return output
}

export function sanitizeObject(obj) {
  const result = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = typeof obj[key] === 'string' ? sanitize(obj[key]) : obj[key]
    }
  }
  return result
}

export function deepMerge(target, source) {
  const output = { ...target }
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        output[key] = deepMerge(output[key] || {}, source[key])
      } else {
        output[key] = source[key]
      }
    }
  }
  return output
}

export function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match
  })
}
