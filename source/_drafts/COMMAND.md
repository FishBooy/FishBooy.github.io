---
title: COMMAND
tags:
---

### 全局安装目录

使 nvm 管理 node 版本时，当全局 module 的安装目录与当前使用的 nvm/versions/node/vx.x.x/node_modules/不一致时，可使用 `npm config` 命令进行修改以保持一致，[详情连接](https://stackoverflow.com/questions/34718528/nvm-is-not-compatible-with-the-npm-config-prefix-option)。

示例：

```shell
npm config delete prefix
npm config set prefix $NVM_DIR/versions/node/vx.x.x // x.x.x为版本号
```
