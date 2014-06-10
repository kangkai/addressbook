var express = require('express');
var ObjectID = require('mongodb').ObjectID;
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
    var found = '';

    req.body._id = ObjectID(req.body._id);

//    db.collection('userlist').find({_id: req.body._id}, {}).toArray(function(err, doc) {
//	console.log(doc);
//    });

    db.collection('userlist').save(req.body, function(err, result) {
	res.send(
	    (err === null) ? {msg: ''} : {msg: err}
	);
    });
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
