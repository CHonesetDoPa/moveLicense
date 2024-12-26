# moveLicense
不觉得electron生成的License碓在根目录下看起来很烦人吗，这个脚本会帮助你把他们放到文件夹里
# 使用
1.下载此脚本到你的项目的根目录下

2.在你的electron-builder配置中加入以下内容来启用moveLicense.js

> "build": {  
>    ...  
>    "afterPack": "moveLicense.js",  
>    ...
> },
