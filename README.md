# scshtml
HTML Template Engine like scss

# usage
```js
export scshtml2html from './scshtml.js';

console.log(scshtml2html(`
  h1.big{"Hello"}
`)) // => <h1 class="big">Hello</h1>

console.log(scshtml2html(`
{
  a[href="https://stackoverflow.com/"class="anchor anchor-external"]{"External link"}
}
`)); // => <div><a href="https://stackoverflow.com/" class="anchor anchor-external">External link</a></div>'

console.log(scshtml2html(`
  #div1;
  #div2;
`)); // => <div id="div1"></div><div id="div2"></div>

console.log(scshtml2html(`
  .block{
    &__elm{
      a[href=https://example.com/ onclick=]{"example"}
    }
    &__elm<&--red>{
      input[type=checkbox disabled]/
      "traling slash means empty element"br/
    }
  }
`)); // => <div class="block"><div class="block__elm"><a href="https://example.com/" onclick="">example</a></div><div class="block__elm block__elm--red"><input type="checkbox" disabled="disabled">trailing slash means empty element<br></div></div>

console.log(scshtml2html(`
  @mixin box{
    .box{
      "box"
    }
  }
  @include box;
  .something;
  @include box;
`)); // => <div class="box">box</div><div class="something"></div><div class="box">box</div>

console.log(scshtml2html(`
  @import /template.scshtml;
`, filename => {
  console.log(filename); // => /template.scshtml
  return `
    .template{"something"}
  `;
})); // => <div class="template">something</div>
```
