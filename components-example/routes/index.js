const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  const components = [
    {
      name: 'title',
      label: 'Title',
      url: '/title/',
    },
    {
      name: 'text',
      label: 'Text',
      url: '/text/',
    },
    {
      name: 'quote',
      label: 'Quote',
      url: '/quote/',
    },
  ];

  res.send(components);
});

router.get('/title/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('title/index', { layout: false, state });
});

router.post('/title/', (req, res) => {
  const toReturn = Object.assign({}, req.body, { type: 'title' });
  res.send(toReturn);
});

router.get('/title/render/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('title/render', { layout: false, state });
});


router.get('/text/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('text/index', { layout: false, state });
});

router.post('/text/', (req, res) => {
  const toReturn = Object.assign({}, req.body, { type: 'text' });
  res.send(toReturn);
});

router.get('/text/render/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('text/render', { layout: false, state });
});


router.get('/quote/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('quote/index', { layout: false, state });
});

router.post('/quote/', (req, res) => {
  const toReturn = Object.assign({}, req.body, { type: 'quote' });
  res.send(toReturn);
});

router.get('/quote/render/', (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state));
  res.render('quote/render', { layout: false, state });
});

module.exports = router;
