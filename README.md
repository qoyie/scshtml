# scshtml

An HTML Template Engine.<br>
You can write like scss.

## Download

 * [CDN copies](https://cdn.jsdelivr.net/gh/qoyie/scshtml/scshtml.js) [![jsDelivr Hits](https://data.jsdelivr.com/v1/package/gh/qoyie/scshtml/badge)](https://www.jsdelivr.com/package/gh/qoyie/scshtml)

## Install

In a browser:
```html
<script src="scshtml.js">
```

Using Github CLI:
```
$ gh repo clone qoyie/scshtml
```

In Node.js:
```js
export scshtml_compile from './scshtml.js';
//or const scshtml_compile = require('./scshtml.js');
```

## Examples

```js
console.log(scshtml_compile(`
  h1.big.hello{"Hello"}
`)) // => <h1 class="big hello">Hello</h1>

console.log(scshtml_compile(`
  {
    a[href="https://stackoverflow.com/"class="anchor anchor-external"]{"External link"}
  }
`)); /* => (beautified)
<div>
  <a href="https://stackoverflow.com/" class="anchor anchor-external">
    External link
  </a>
</div>
*/

console.log(scshtml_compile(`
  #div1;
  #div2;
`)); /* => (beautified)
<div id="div1"></div>
<div id="div2"></div>
*/
console.log(scshtml_compile(`
  .block{
    &__elm{
      a[href=https://example.com/ onclick="return false"]{"example"}
    }
    &__elm<&--red>{
      input[type=checkbox disabled*]
      "traling semicolon is unnecessary if the element is empty element"
      br
    }
  }
`)); /* => (beautified)
<div class="block">
  <div class="block__elm">
    <a href="https://example.com/" onclick="return false;">
      example
    </a>
  </div>
  <div class="block__elm block__elm--red">
    <input type="checkbox" disabled="disabled">
    trailing semicolon is unnecessary if the element empty element
    <br>
  </div>
</div>
*/

console.log(scshtml_compile(`
  @mixin box{
    .box{
      "box"
    }
  }
  @include box;
  .something;
  @include box;
`)); /* => (beautified)
<div class="box">
  box
</div>
<div class="something"></div>
<div class="box">
  box
</div>
*/

console.log(scshtml_compile(`
  @import /template.scshtml;
`, {
  import: filename => {
    console.log(filename); // => /template.scshtml
    return `
      .template{"something"}
    `;
  }
})); /* => (beautified)
<div class="template">
  something
</div>
*/

console.log(scshtml_compile(`
  @import /template.scshtml;
  @include template{
    a[href=https://www.github.com/]{"GitHub"}
  }
`, {
  import: filename => {
    return `
      @mixin template{
        .box{
          @content;
        }
      }
    `;
  }
})); /* => (beautified)
<div class="box">
  <a href="https://www.github.com/">
    GitHub
  </a>
</div>
*/

console.log(scshtml_compile(`
  a[:https://www.example.com/]{"Domain for example."}
  input#id[/radio $name #value]
  label[%id]{"label"}
  img[&https://avatars.githubusercontent.com/u/97143783?s=96&v=4 -100 |50]
`)); /* => (beautified)
<a href="https://www.example.com/">
  Domain for example.
</a>
<input id="id" type="radio" name="name" value="value">
<label for="id">
  label
</label>
<img src="https://avatars.githubusercontent.com/u/97143783?s=96&v=4" width="100" height="50">
*/

console.log(scshtml_compile(`
(switch(1){)
  (case 0:)
    "0"
    (break;)
  (case 1:)
    "1"
    (break;)
  (case 2:)
    "2"
    (break;)
(})
@for i from 0 through 3{
  a[:#(=i)]{"(=i)"}
}
@if typeof(window)!=='undefined'{
  "Running on browser."
}@else if typeof(global)!=='undefined'{
  "Running on node."
}@else{
  "Running on something else."
}
@while false{
  (throw new Error;)
}
`)); /* => (beautified)
1
<a href="#0">0</a>
<a href="#1">1</a>
<a href="#2">2</a>
<a href="#3">3</a>
Running on {depends on environment}.
*/
```
