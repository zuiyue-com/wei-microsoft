# wei-microsoft
微软审核自动提交
Microsoft antivirus audit fully automatic upload

# 功能

- 新版页面提交：https://security.microsoft.com/

- [x] 加载cookie
- [x] if 确认是否登录
    - [x] 未登录加载本地帐号和密码
    - [x] 自动登录
    - [x] 保存cookie
- [x] 加载提交列表 ../wei-updater/build.dat
- [x] for 循环提交列表文件
    - [x] 访问 https://www.microsoft.com/en-us/wdsi/filesubmission
    - [x] 上传文件
    - [x] 提交