var scshtml_compile = (() => {

const empty_tags = Object.freeze(new Set(
	'area,base,br,col,embed,hr,img,input,keygen,link,meta,menuitem,param,source,track,wbr'.split(',')));

function handle(src, append, command) {
	if (command === void 0) {
		command = {};
	}
	let stack = [];
	let i = 0;
	let tagname = '';
	let attr = null;
	let parent_attr = ['class', ''];
	let parent_attr_stack = [];
	let mixins = {};
	let mixin_stack = [];
	let content = null;
	if (command._) {
		if (command._.i) {
			i = command._.i;
		}
		if (command._.content) {
			content = command._.content;
		}
		if (command._.mixins) {
			mixins = command._.mixins;
		}
	}
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
				let k = '';
				let v = '';
				if (attr == null) {
					attr = {};
				}
				outer:
				for (let s = src[++i]; i < src.length && s !== ']'; s = src[++i]) {
					if (s === ' ') {
						attr[k] = '';
						k = '';
					} else if (s === '*') {
						attr[k] = k;
						k = '';
					} else if ('a' <= s && s <= 'z') {
						k += s;
					} else {
						if (s !== '=') {
							if (k) {
								attr[k] = '';
							}
							k = {
								'%': 'for',
								'|': 'height',
								':': 'href',
								'$': 'name',
								'&': 'src',
								'/': 'type',
								'#': 'value',
								'-': 'width',
							} [s];
						}
						if (src[i + 1] === '"') {
							i++;
							while (i < src.length) {
								s = src[++i];
								if (s === '"') {
									break;
								} else {
									v += s;
								}
							}
							if (src[i + 1] === ' ') {
								i++;
							}
						} else {
							while (i < src.length) {
								s = src[++i];
								if (s === ' ') {
									break;
								} else if (s === ']') {
									break outer;
								} else {
									v += s;
								}
							}
						}
						attr[k] = v;
						k = v = '';
					}
				}
				if (k) {
					attr[k] = v;
				}
			}
				break;
			case '"':
			case "'": {
				if (tagname || attr) {
					append(`<${tagname||'div'}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
					if (!empty_tags.has(tagname)) {
						append(`</${tagname||'div'}>`);
					}
				}
				const end = src[i];
				let buf = '';
				let s;
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
								if (src[i + 1] === '\n') {
									i++;
								}
								break;
							case '\n':
								break;
							default:
								buf += s;
						}
					} else if (s === end) {
						break;
					} else {
						buf += s;
					}
				}
				append(buf);
			}
				break;
			case '{':
				if (!tagname) {
					tagname = 'div';
				}
				stack.push([tagname, parent_attr]);
				append(`<${tagname}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
				tagname = '';
				attr = null;
				break;
			case '}': {
				if (tagname || attr) {
					append(`<${tagname||'div'}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
					if (!empty_tags.has(tagname)) {
						append(`</${tagname||'div'}>`);
					}
				}
				let j = 0;
				for (let s = src[i + 1]; i < src.length && '0' <= s && s <= '9'; s = src[++i + 1]) {
					j *= 10;
					j += +s;
				}
				if (stack.length < ++j) {
					while (stack.length) {
						append(`</${stack.pop()[0]}>`);
					}
					return;
				}
				for (; j; j--) {
					append(`</${stack.pop()[0]}>`);
				}
				parent_attr = stack.length ? stack[stack.length-1][1] : ['class', ''];
				tagname = '';
				attr = null;
				break;
			}
			case ';':
				parent_attr = stack.length ? stack[stack.length-1][1] : ['class', ''];
				append(`<${tagname||'div'}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
				if (!empty_tags.has(tagname)) {
					append(`</${tagname||'div'}>`);
				}
				tagname = '';
				attr = null;
				break;
			case '<':
				parent_attr_stack.push(parent_attr);
				break;
			case '>':
				parent_attr = parent_attr_stack.pop();
				break;
			case '%':
				if (stack.length) stack[stack.length-1][1] = parent_attr;
				// FALLTHROUGH
			case '$':
				attr = null;
				break;
			case '@': {
				if (empty_tags.has(tagname)) {
					i--;
					parent_attr = stack.length ? stack[stack.length-1][1] : ['class', ''];
					append(`<${tagname||'div'}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
					tagname = '';
					attr = null;
				}
				let buf = '';
				let s;
				for (s = src[++i]; i < src.length && s !== ';' && s !== '{'; s = src[++i]) {
					buf += s;
				}
				const arr = buf.split(' ');
				switch (arr[0]) {
					case 'import':
						handle(command['import'](arr[1]), append, {
							...command,
							_: {
								content: [src, i + 1],
								mixins
							}
						});
						break;
					case 'mixin': {
						const j = arr[1].indexOf('(');
						const k = arr[1].indexOf('{');
						mixins[arr[1].substring(0, j < 0 ? k < 0 ? arr[1].length : k : j < k ? j : k)] = [src, i + 1];
					}
						break;
					case 'include':
						handle(mixins[arr[1]][0], append, {
							...command,
							_: {
								i: mixins[arr[1]][1],
								content: [src, i + 1],
								mixins
							}
						});
						break;
					case 'content':
						handle(content[0], append, {
							...command,
							_: {
								i: content[1],
								content: [src, i + 1],
								mixins
							}
						});
						break;
				}
				if (s === '{') {
					for (let j = 1; j && i < src.length;) {
						if (src[++i] === '{') {
							j++;
						} else if (src[i] === '}') {
							j--;
						}
					}
				}
			}
				break;
			case ' ':
			case '\n':
				break;
			default:
				if (empty_tags.has(tagname)) {
					i--;
					parent_attr = stack.length ? stack[stack.length-1][1] : ['class', ''];
					append(`<${tagname||'div'}${attr===null?'':Object.entries(attr).map(([k,v])=>' '+k+(v?'="'+v+'"':'')).join('')}>`);
					tagname = read();
					attr = null;
				} else if (tagname || attr) {
					console.log('unexpected tagname: ' + read() + ' after ' + tagname + JSON.stringify(attr));
					return;
				} else {
					i--;
					tagname = read();
				}
		}
	}
	while (stack.length) {
		append(`</${stack.pop()[0]}>`);
	}

	function read(type, pre) {
		let buf = pre === void 0? '' : pre;
		while (i < src.length) {
			const s = src[++i];
			if ('a' <= s && s <= 'z' ||
					'A' <= s && s <= 'Z' ||
					'0' <= s && s <= '9' ||
					s === '-' || s === '_') {
				buf += s;
			} else {
				break;
			}
		}
		i--;
		if (type === void 0) {
			return buf;
		}
		if (attr === null) {
			attr = {};
		}
		attr[type] = (attr[type] === void 0 ? '' : attr[type] + ' ') + buf;
		parent_attr = [type, buf];
	}
}

function preprocess(src, option) {
	let temp = '',
			buf = '',
			quote = 0;
	const stack = [];
	//quote 0: none
	//quote 1: [
	//quote 2: "
	//quote 3: ["
	//quote 4: '
	for (let i = 0; i < src.length; ++i) {
		switch (src[i]) {
			case '/':
				if (quote) {
					buf += '/';
					break;
				}
				if (src[i + 1] === '*') {
					i++;
					while (i < src.length && src[++i] !== '*' && src[i + 1] !== '/');
					i++;
				} else {
					buf += '/';
				}
				break;
			case '"': buf += '"'; quote = [2, 3, 0, 1, 4, 5][quote]; break;
			case "'": buf += "'"; quote = [4, 1, 2, 3, 0, 5][quote]; break;
			case '[': buf += '['; quote = [1, 1, 2, 3, 4, 5][quote]; break;
			case ']': buf += ']'; quote = [0, 0, 2, 3, 4, 5][quote]; break;
			case '{':
				quote = [0, 1, 2, 3, 4, 0][quote];
				stack.push(false);
				buf += '{';
				break;
			case '}':
				if (stack.pop()) {
					if (buf) {
						temp += 'sys.print(`' + buf + '`);';
						buf = '';
					}
					temp += '}';
				} else {
					buf += '}';
				}
				break;
			case '@': {
				if (src[i + 1] === '{') {
					if (buf) {
						temp += 'sys.print(`' + buf + '`);';
						buf = '';
					}
					for (i += 2; i < src.length; i++) {
						if (src[i] === '@' &&
						    src[i + 1] === '}') {
							i++;
							break;
						}
						temp += src[i];
					}
					break;
				}
				let c = '';
				while (i < src.length) {
					const s = src[++i];
					if ('a' <= s && s <= 'z' ||
							'A' <= s && s <= 'Z' ||
							'0' <= s && s <= '9' ||
							s === '-' || s === '_') {
						c += s;
					} else {
						break;
					}
				}
				i--;
				if (c === 'if' ||
				    c === 'else' ||
				    c === 'each' ||
				    c === 'for' ||
				    c === 'while' ||
				    c === 'load') {
					const template_stack = [];
					let d = '';
					if (buf) {
						temp += 'sys.print(`' + buf + '`);';
						buf = '';
					}
					i++;
					outest:
					for (let j = 0; i < src.length; i++) {
						const temp = 0;
						if (src[i] !== '/' &&
								src[i] !== '{') {
							d += src[i];
						}
						switch (src[i]) {
							case '{':
								if (j === 0) {
									break outest;
								}
								template_stack[template_stack.length - 1]++;
								d += src[i];
								// FALLTHROUGH
							case '(':
							case '[':
								j++;
								break;
							case '}':
								template_stack[template_stack.length - 1]--;
								// FALLTHROUGH
							case ')':
							case ']':
								j--;
								if (j < 0) {
									console.log('Unexpected "' + src[i] + '": (evaluating :@' + c + d + src[i] + ')');
									return;
								}
								break;
							case "'":
								outer:
								while (i < src.length) {
									d += src[++i];
									switch (src[i]) {
										case '\\':
											d += src[++i];
											break;
										case "'":
											break outer;
									}
								}
								break;
							case '"':
								outer:
								while (i < src.length) {
									d += src[++i];
									switch (src[i]) {
										case '\\':
											d += src[++i];
											break;
										case '"':
											break outer;
									}
								}
								break;
							case '`':
								outer:
								while (i < src.length) {
									d += src[++i];
									switch (src[i]) {
										case '\\':
											d += src[++i];
											break;
										case '$':
											if (src[i + 1] === '{') {
												template_stack.push(1);
											}
										case '`':
											break outer;
									}
								}
								break;
							case '/':
								if (src[++i] === '/') {
									while (i < src.length && src[++i] !== '\n');
								} else if (src[i] === '*') {
									while (i < src.length && src[++i] !== '*' && src[i + 1] !== '/');
									i++;
								} else {
									d += '/';
									i--;
								}
								break;
						}
					}
					if (c === 'if' || c === 'while') {
						temp += c + '(' + d + '){';
					} else if (c === 'else') {
						if (d.trim() === '') {
							temp += 'else{';
						} else {
							const e = d.replace(/\s+/g, ' ').trim().split(' ');
							temp += `else ${e[0]}(${e.slice(1).join(' ')}){`;
						}
					} else if (c === 'each') {
						const e = d.match(/^\s+([\w\s\$,]*)\s+in\s*([^\w$].*)$/);
						if (~e[1].indexOf(',')) {
							temp += `for(const[${e[1]}]of ${e[2]}){`;
						} else {
							temp += `for(const ${e[1]} of ${e[2]}){`;
						}
					} else if (c === 'for') {
						const e = d.split('through');
						const f = e[0].split('from');
						temp += `for(let ${f[0]}=${f[1]};${f[0]}<=${e[1]};${f[0]}++){`;
					} else if (c === 'load') {
						const e = d.substring(0, d.indexOf(' '));
						if (e === 'json') {
							const f = d.substring(d.indexOf(' ')).split('=');
							temp += `const ${f[0]} =sys.load_json('${f.slice(1).join('=')}')`;
						}
					}
					stack.push(true);
				} else {
					quote = 5;
					buf += '@' + c;
				}
			}
				break;
			case '\\':
				if (src[i + 1] === '(') {
					buf += '(';
					i++;
				} else {
					buf += '\\\\';
				}
				break;
			case ' ':
				if (quote) {
					buf += ' ';
				}
			case '\n':
				break;
			default:
				if (('a' <= src[i] && src[i] <= 'z' ||
						 'A' <= src[i] && src[i] <= 'Z') &&
						(src[i - 1] === ' ' ||
						 src[i - 1] === '\n') &&
						('a' <= buf[buf.length - 1] && buf[buf.length - 1] <= 'z' ||
						 'A' <= buf[buf.length - 1] && buf[buf.length - 1] <= 'Z')) {
					buf += ' ';
				}
				buf += src[i];
		}
	}
	if (buf) {
		temp += 'sys.print(`' + buf + '`);';
	}
	let result = '';
	try {
		new Function('sys', temp)({
			load_json:f=>JSON.stringify(options.import(f)),
			print: function(...args) {
				result += args;
			}
		});
	} catch (e) {
		console.log(e, temp);
	}
	return result;
}

function compile(src, command) {
	const cmd = Object.create(command);
	let buf = '';
	cmd.import = file => preprocess(command.import(file));
	handle(preprocess(src), e => {
		buf += e;
	}, cmd);
	return buf;
}
compile.handle=handle;
compile.preprocess=preprocess;

if (typeof(module) !== 'undefined' &&
    typeof(module.exports) !== 'undefined') {
	module.exports = compile;
}

return compile;

})();
