export function scshtml2htmlManual(src, append, command) {
  command ??= {};
  let stack = [],
    i = 0,
    tagname = '',
    attr = null,
    parent_attr = ['class', ''],
    parent_attr_stack = [],
    variables = {},
    mixins = {},
    mixin_stack = [],
    content = null;
  command._ && ({
    i,
    content,
    mixins
  } = {
    i,
    content,
    mixins,
    ...(command._)
  });
  for (; i < src.length; i++) {
    switch (src[i]) {
      case '.':
        read('class');
        break;
      case '#':
        read('id');
        break;
      case '&':
        read(...parent_attr);
        break;
      case '[': {
        let k = '',
          v = '';
        attr ??= {};
        _: for (let s = src[++i]; i < src.length && s !== ']'; s = src[++i]) {
          if (s === '=') {
            if (src[i + 1] === '"') {
              i++;
              while (i < src.length)
                if ((s = src[++i]) === '"') break;
                else v += s;
              if (src[i + 1] === ' ') i++;
              attr[k] = v;
            } else
              while (i < src.length)
                if ((s = src[++i]) === ' ') break;
                else if (s === ']') break _;
            else v += s;
            attr[k] = v;
            k = v = '';
          } else s === ' ' ? (attr[k] = k, k = '') : k += s;
        }
        if (k) attr[k] = v || k;
      }
      break;
      case '"': {
        let buf = '';
        while (i < src.length) {
          s = src[++i];
          if (s === '\\') {
            switch (s = src[++i]) {
              case 'n':
                buf += '\n';
                break;
              case 'r':
                buf += '\r';
                break;
              case 'v':
                buf += '\v';
                break;
              case 't':
                buf += '\t';
                break;
              case 'b':
                buf += '\b';
                break;
              case 'f':
                buf += '\f';
                break;
              case '\r':
                if (src[i + 1] == '\n') i++;
              case '\n':
                break;
              default:
                buf += s;
            }
          } else if (s === '"') break;
          else buf += s;
        }
        append(buf);
      }
      break;
      case '{':
        stack.push([tagname || 'div', parent_attr]);
        append(`<${tagname||'div'}${attr===null?'':
        ' '+Object.entries(attr).map(([k,v])=>k+'="'+v+'"').join(' ')}>`);
        tagname = '';
        attr = null;
        break;
      case '}':
        if (tagname || attr) append(`<${tagname||'div'}${attr===null?'':
        ' '+Object.entries(attr).map(([k,v])=>k+'="'+v+'"').join(' ')}></${tagname||'div'}>`); {
          let j = 0;
          for (let s; i < src.length && '0' <= (s = src[i + 1]) && s <= '9'; i++) j *= 10, j += +s;
          if (++j >= stack.length) {
            while (stack.length) append(`</${stack.pop()[0]}>`);
            return;
          }
          for (; j; j--) append(`</${stack.pop()[0]}>`);
        }
        parent_attr = stack.length ? stack.at(-1)[1] : ['class', ''];
        tagname = '';
        attr = null;
        break;
      case ';':
        parent_attr = stack.length ? stack.at(-1)[1] : ['class', ''];
        append(`<${tagname||'div'}${attr===null?'':
        ' '+Object.entries(attr).map(([k,v])=>k+'="'+v+'"').join(' ')}></${tagname||'div'}>`);
        tagname = '';
        attr = null;
        break;
      case '<':
        parent_attr_stack.push(parent_attr);
        break;
      case '>':
        parent_attr = parent_attr_stack.pop();
        break;
      case '/':
        append(`<${tagname||'div'}${attr===null?'':
        ' '+Object.entries(attr).map(([k,v])=>k+'="'+v+'"').join(' ')}>`);
        parent_attr = stack.length ? stack.at(-1)[1] : ['class', ''];
        tagname = '';
        attr = null;
        break;
      case '%':
        if (stack.length) stack.at(-1)[1] = parent_attr;
        attr = null;
        break;
      case '$':
        if (tagname || attr) attr = null;
        else {
          let buf = '',
            s;
          for (s = src[++i]; i < src.length && s !== ';'; s = src[++i]) buf += s;
          const arr = buf.split(':');
          if (arr.length === 1) {
            append(variables[arr[0]]);
            break
          }
          if (arr.length !== 2) return console.log('Unrecognizable variable declaration:', buf);
          variables[arr[0]] = arr[1].split(',').map(e => e.trim());
        }
        break;
      case '@': {
        let buf = '',
          s;
        for (s = src[++i]; i < src.length && s !== ';' && s !== '{'; s = src[++i]) buf += s;
        const arr = buf.split(' ');
        switch (arr[0]) {
          case 'import':
            scshtml2htmlManual(command['import'](arr.slice(1)), append, {
              ...command,
              _: {
                mixins
              }
            });
            break;
          case 'mixin': {
            const j = arr[1].indexOf('('),
              k = arr[1].indexOf('{');
            mixins[arr[1].substring(0, j < 0 ? k < 0 ? arr[1].length : k : j < k ? j : k)] = [src, i + 1];
          }
          break;
          case 'include':
            scshtml2htmlManual(mixins[arr[1]][0], append, {
              ...command,
              _: {
                i: mixins[arr[1]][1],
                content: [src, i + 1],
                mixins
              }
            });
            break;
          case 'content':
            scshtml2htmlManual(content[0], append, {
              ...command,
              _: {
                i: content[1],
                mixins
              }
            });
            break;
        }
        if (s === '{')
          for (let j = 1; j && i < src.length;) j += 1 - Math.abs('{{}'.indexOf(src[++i]));
      }
      break;
      case ' ':
      case '\n':
        break;
      default:
        if (tagname || attr) {
          console.log('unexpected tagname', tagname, attr, read());
          return;
        }
        i--;
        tagname = read();
    }
  }
  while (stack.length) append(`</${stack.pop()[0]}>`);

  function read(type, pre) {
    let buf = pre ?? '';
    while (i < src.length) {
      const s = src[++i];
      if ('a' <= s && s <= 'z' || 'A' <= s && s <= 'Z' || '0' <= s && s <= '9' || s === '-' || s === '_') {
        buf += s;
      } else break;
    }
    i--;
    if (type === void 0) return buf;
    attr ??= {};
    attr[type] ??= '';
    attr[type] += (attr[type].length ? ' ' : '') + buf;
    parent_attr = [type, buf];
  }
}

export default function scshtml2html(src, importer) {
  let buf = '';
  scshtml2htmlManual(src, e => {
    buf += e;
  }, {
    import: importer
  });
  return buf;
}
