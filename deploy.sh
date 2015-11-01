#!/bin/bash

REMOTE=root@188.166.231.38
APP=currency-react
ARCHIVE=currency-react.tar.gz

./node_modules/gulp/bin/gulp.js build

tar -zcf $ARCHIVE -C dist .
ssh $REMOTE "mkdir -p /home/builds"
scp $ARCHIVE $REMOTE:/home/builds/
ssh $REMOTE "mkdir -p /home/apps/$APP"
ssh $REMOTE "tar -zxf /home/builds/$ARCHIVE -C /home/apps/$APP"
