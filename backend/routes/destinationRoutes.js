const r=require('express').Router(),c=require('../controllers/destinationController');r.get('/',c.list);r.get('/recommendations',c.recommendations);r.get('/:id',c.detail);module.exports=r;
