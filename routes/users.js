var express = require('express');
var MongoDb = require('mongodb');
var ObjectID = MongoDb.ObjectID;
var router = express.Router();

/* GET userlist */
router.get('/userlist', function(req, res) {
    var db = req.db;
    db.collection('userlist').find().toArray(function(err, items) {
	res.json(items);
    });
});

/* POST to add user */
router.post('/modifyuser', function(req, res) {
    var db = req.db;
    var collection = '';
    var id = '';

    if (req.body.db_id) {
	req.body._id = ObjectID(req.body.db_id);
    } else {
	req.body._id = ObjectID();
    }
    req.body.db_id = '';

    if (req.body.avatarid) {
	id = req.body.avatarid = ObjectID(req.body.avatarid);
	collection = 'avatar';
    } else {
	id = req.body._id;
	collection = 'userlist';
    }

    db.collection(collection).findOne({_id: id}, function(err, doc) {
	if (doc) {
	    req.body.avatartype = doc.avatartype;
	    req.body.avatardata = doc.avatardata;
	}

	db.collection('userlist').save(req.body, function(err, result) {
	    res.send(
		(err === null) ? {msg: ''} : {msg: err}
	    );
	});
    });
});


/* user avata */
router.post('/avatar', function(req, res) {
    'use strict';

    var db = req.db;
    var path = require('path');
    var fs = require('fs');
    // Since Node 0.8, .existsSync() moved from path to fs:
    var _existsSync = fs.existsSync || path.existsSync;
    var formidable = require('formidable');
    var nodeStatic = require('node-static');
    // var imageMagick = require('imagemagick');
    var options = {
        //tmpDir: __dirname + '/tmp',
	tmpDir: '/tmp',
        publicDir: __dirname + '/public',
        uploadDir: __dirname + '/public/files',
        uploadUrl: '/files/',
        maxPostSize: 11000000000, // 11 GB
        minFileSize: 1,
        maxFileSize: 10000000000, // 10 GB
        // acceptFileTypes: /.+/i,
	acceptFileTypes: /\.(gif|jpe?g|png)$/i,
        // Files not matched by this regular expression force a download dialog,
        // to prevent executing any scripts in the context of the service domain:
        inlineFileTypes: /\.(gif|jpe?g|png)$/i,
        imageTypes: /\.(gif|jpe?g|png)$/i,
        imageVersions: {
            'thumbnail': {
                width: 80,
                height: 80
            }
        },
        accessControl: {
            allowOrigin: '*',
            allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
            allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
        },
        /* Uncomment and edit this section to provide the service via HTTPS:
           ssl: {
           key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
           cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
           },
        */
        nodeStatic: {
            cache: 3600 // seconds to cache served files
        }
    };
    var utf8encode = function (str) {
        return unescape(encodeURIComponent(str));
    };
    var fileServer = new nodeStatic.Server(options.publicDir, options.nodeStatic);
    var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;
    var nameCountFunc = function (s, index, ext) {
        return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
    };
    var FileInfo = function (file) {
        this.name = file.name;
        this.size = file.size;
        this.avatartype = file.type;
        this.deleteType = 'DELETE';
    };
    var UploadHandler = function (req, res, callback) {
        this.req = req;
        this.res = res;
        this.callback = callback;
    };

    fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
        // Prevent browsers from MIME-sniffing the content-type:
        _headers['X-Content-Type-Options'] = 'nosniff';
        if (!options.inlineFileTypes.test(files[0])) {
            // Force a download dialog for unsafe file extensions:
            _headers['Content-Type'] = 'application/octet-stream';
            _headers['Content-Disposition'] = 'attachment; filename="' +
                utf8encode(path.basename(files[0])) + '"';
        }
        nodeStatic.Server.prototype.respond
            .call(this, pathname, status, _headers, files, stat, req, res, finish);
    };

    FileInfo.prototype.validate = function () {
        if (options.minFileSize && options.minFileSize > this.size) {
            this.error = 'File is too small';
        } else if (options.maxFileSize && options.maxFileSize < this.size) {
            this.error = 'File is too big';
        } else if (!options.acceptFileTypes.test(this.name)) {
            this.error = 'Filetype not allowed';
        }
        return !this.error;
    };

    FileInfo.prototype.safeName = function () {
        // Prevent directory traversal and creating hidden system files:
        this.name = path.basename(this.name).replace(/^\.+/, '');
        // Prevent overwriting existing files:
        while (_existsSync(options.uploadDir + '/' + this.name)) {
            this.name = this.name.replace(nameCountRegexp, nameCountFunc);
        }
    };

    FileInfo.prototype.initUrls = function (req) {
        if (!this.error) {
            var that = this,
            baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadUrl;
            this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
            Object.keys(options.imageVersions).forEach(function (version) {
                if (_existsSync(
                    options.uploadDir + '/' + version + '/' + that.name
                )) {
                    that[version + 'Url'] = baseUrl + version + '/' +
                        encodeURIComponent(that.name);
                }
            });
        }
    };

    UploadHandler.prototype.get = function () {
        var handler = this,
        files = [];
        fs.readdir(options.uploadDir, function (err, list) {
            list.forEach(function (name) {
                var stats = fs.statSync(options.uploadDir + '/' + name),
                fileInfo;
                if (stats.isFile() && name[0] !== '.') {
                    fileInfo = new FileInfo({
                        name: name,
                        size: stats.size
                    });
                    fileInfo.initUrls(handler.req);
                    files.push(fileInfo);
                }
            });
            handler.callback({files: files});
        });
    };
    UploadHandler.prototype.post = function () {
        var handler = this,
        form = new formidable.IncomingForm(),
        tmpFiles = [],
        files = [],
        map = {},
        counter = 1,
        redirect,
        finish = function () {
            counter -= 1;
            if (!counter) {
                files.forEach(function (fileInfo) {
                    fileInfo.initUrls(handler.req);
                });
                handler.callback({files: files}, redirect);
            }
        };
        form.uploadDir = options.tmpDir;
        form.on('fileBegin', function (name, file) {
            tmpFiles.push(file.path);
            var fileInfo = new FileInfo(file, handler.req, true);
            fileInfo.safeName();
            map[path.basename(file.path)] = fileInfo;
            files.push(fileInfo);
        }).on('field', function (name, value) {
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file', function (name, file) {
            var fileInfo = map[path.basename(file.path)];
            fileInfo.size = file.size;
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }

	    fileInfo._id = new ObjectID();
	    fileInfo.date = new Date();
	    var data = fs.readFileSync(file.path);
	    fileInfo.avatardata = new MongoDb.Binary(data);

	    db.collection('avatar').save(fileInfo, function(err, result) {
		if (err !== null) {
		    console.log("db save fail");
		}
	    });

	    fs.unlink(file.path, function(err) {
		if (err) {
		    console.log("unlink failed: " + image.path);
		}
	    });

/*
            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    counter += 1;
                    var opts = options.imageVersions[version];
                    imageMagick.resize({
                        width: opts.width,
                        height: opts.height,
                        srcPath: options.uploadDir + '/' + fileInfo.name,
                        dstPath: options.uploadDir + '/' + version + '/' +
                            fileInfo.name
                    }, finish);
                });
            }
*/

        }).on('aborted', function () {
            tmpFiles.forEach(function (file) {
                fs.unlink(file);
            });
        }).on('error', function (e) {
            console.log(e);
        }).on('progress', function (bytesReceived) {
            if (bytesReceived > options.maxPostSize) {
                handler.req.connection.destroy();
            }
        }).on('end', finish).parse(handler.req);
    };
    UploadHandler.prototype.destroy = function () {
        var handler = this,
        fileName;
        if (handler.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
            fileName = path.basename(decodeURIComponent(handler.req.url));
            if (fileName[0] !== '.') {
                fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                    });
                    handler.callback({success: !ex});
                });
                return;
            }
        }
        handler.callback({success: false});
    };


    // Let's rock
    res.setHeader(
        'Access-Control-Allow-Origin',
        options.accessControl.allowOrigin
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        options.accessControl.allowMethods
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        options.accessControl.allowHeaders
    );
    var handleResult = function (result, redirect) {
        if (redirect) {
            res.writeHead(302, {
                'Location': redirect.replace(
                        /%s/,
                    encodeURIComponent(JSON.stringify(result))
                )
            });
            res.end();
        } else {
            res.writeHead(200, {
                'Content-Type': req.headers.accept
                    .indexOf('application/json') !== -1 ?
                    'application/json' : 'text/plain'
            });
            res.end(JSON.stringify(result));
        }
    },
    setNoCacheHeaders = function () {
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
    },
    handler = new UploadHandler(req, res, handleResult);

    switch (req.method) {
    case 'OPTIONS':
        res.end();
        break;
    case 'HEAD':
    case 'GET':
        if (req.url === '/') {
            setNoCacheHeaders();
            if (req.method === 'GET') {
                handler.get();
            } else {
                res.end();
            }
        } else {
            fileServer.serve(req, res);
        }
        break;
    case 'POST':
        setNoCacheHeaders();
        handler.post();
        break;
    case 'DELETE':
        handler.destroy();
        break;
    default:
        res.statusCode = 405;
        res.end();
    };

});

/* DELETE to delete a user */
router.delete('/deleteuser/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;

    db.collection('userlist').removeById(ObjectID(userToDelete), function(err, result) {
	res.send(
	    (result === 1) ? {msg: ''} : {msg: 'error: ' + err}
	);
    });
});

module.exports = router;
