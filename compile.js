const fs=require('fs');
const compiler=require('./scshtml.js');
const files={};
function read(file){
  if(!(file in files)){
    files[file]=fs.readFileSync(file,'utf-8');
    console.log('Read '+file+'('+((files[file].match(/\n/g)||[]).length+1)+' lines)');
  }
  return files[file];
}
function compile(file,out){
  fs.writeFileSync((out||'.')+'/'+file.replace(/\.scsml$/,'')+'.html',compiler(read(file),{
    import:read
  }))
}
compile.read=read;
compile.files=files;
compile.compiler=compiler;
module.exports=compile;
if (require.main === module) {
  const path = require('path');
  const main = (dirpath, dirname) => {
    fs.readdir(path.join(dirpath, dirname), {withFileTypes: true}, (err, dirents) => {
      if (err) {
        if (err.errno === -4052 && dirpath.endsWith('.scsml')) {
          compile(fp,process.argv[3]);
          return;
        }
        console.log(err);
        return;
      }
      for (const dirent of dirents) {
        const fp = dirname ? path.join(dirname, dirent.name) : dirent.name;
        if (dirent.isDirectory()) {
          main(dirname, fp);
        } else if (fp.endsWith('.scsml')) {
          try{
            compile(fp,process.argv[3]);
          }catch(exc){
            console.log('Exception while compiling '+fp,exc);
          }
        }
      }
    });
  }
  main(process.argv[2],'');
}