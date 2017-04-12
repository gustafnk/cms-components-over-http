const express = require('express');
const Bluebird = require('bluebird');
const fs = require('fs');

Bluebird.promisifyAll(fs);

const requestAsync = Bluebird.promisify(require('request'));
const uuid = require('uuid/v4');
const _ = require('lodash');

const router = express.Router();

const serviceEndpoints = ['http://localhost:3001'];

const page = {
  content: [
    {
      id: uuid(),
      type: 'title',
      text: 'The title here',
      sub: 'Subtitle here',
    },
    {
      id: uuid(),
      type: 'text',
      text: 'Lorem ipsum....',
    },
    {
      id: 'e91c2530-5a47-412e-91e7-0f74e77f1e24',
      type: 'quote',
      text: 'The quote',
    },
  ],
};

// TODO Don't cheat with state
let components;
let componentsWithFullUrls;

const getComponentsWithFullUrls = (componentArray) => {
  return componentArray.map(component => Object.assign({}, component, {
    url: `${serviceEndpoints[0]}${component.url}`,
  }));
};

router.get('/edit/id', (req, res) => {
  requestAsync(serviceEndpoints[0]).then((response) => {
    components = JSON.parse(response.body);

    componentsWithFullUrls = getComponentsWithFullUrls(components);

    const pageWithTypeResource = page.content.map((contentItem, index) => {
      const foundComponentType = componentsWithFullUrls.filter(component => contentItem.type === component.name)[0];

      if (!foundComponentType) {
        console.log(`Could not find component type ${contentItem.type}`);
      }

      const state = Object.assign({}, contentItem, { order: index });

      const encodedState = encodeURIComponent(JSON.stringify(state));
      const componentUrlWithStateParam = `${foundComponentType.url}?state=${encodedState}`;

      return Object.assign({}, contentItem, {
        componentUrl: componentUrlWithStateParam,
      });
    });

    const viewModel = {
      content: pageWithTypeResource,
      availableComponents: componentsWithFullUrls.map(component => _.pick(component, ['name', 'label'])),
    };

    res.render('pages/edit', viewModel);
  });
});

router.post('/edit/id', (req, res) => {
  const bodyContainingOnlyComponentItems = _.pickBy(req.body, (value, key) => {
    return key.startsWith('components[');
  });

  const componentItems = _.chain(Object.keys(bodyContainingOnlyComponentItems).map((key) => {
    const match = key.match(/components\[(.*)\]-(.*)/);
    const order = match[1];
    const keyWithoutPrefix = match[2]; // Strip components[i]- prefix

    return ({
      order: parseInt(order, 10),
      key: keyWithoutPrefix,
      value: bodyContainingOnlyComponentItems[key],
    });
  })).groupBy('order').values().value();

  Bluebird.mapSeries(componentItems, (componentItem) => {
    const itemsWithOutComponent = componentItem.map((item) => {
      const matchResult = item.key.match(/(.*)-(.*)/);
      const componentType = matchResult[1];
      const componentField = matchResult[2];

      return {
        componentType,
        key: componentField,
        value: item.value,
      };
    });

    // Assume homogenous component type array
    const foundComponentType = componentsWithFullUrls.filter(component => {
      return itemsWithOutComponent[0].componentType === component.name;
    })[0];

    const keysAndValues = itemsWithOutComponent.map(item => _.pick(item, ['key', 'value']));

    const form = _.chain(keysAndValues).keyBy('key').mapValues(value => value.value).value();

    const url = `${foundComponentType.url}`;
    return requestAsync({ url, method: 'POST', form: form }).then((response) => {
      console.log(response.body);
      return JSON.parse(response.body);
    });
  }).then((responses) => {
    page.content = responses;

    res.redirect('/pages/edit/id');
  });
});

router.post('/edit/id/render', (req, res) => {
  componentsWithFullUrls = getComponentsWithFullUrls(components);

  // TODO DRY
  Bluebird.mapSeries(page.content, (contentItem) => {
    const foundComponentType = componentsWithFullUrls.filter(component => contentItem.type === component.name)[0];

    if (!foundComponentType) {
      console.log(`Could not find component type ${contentItem.type}`);
    }

    const component = Object.assign({}, contentItem, {
      url: `${foundComponentType.url}`,
    });

    const state = _.omit(component, 'type');

    const encodedState = encodeURIComponent(JSON.stringify(state));
    const url = `${component.url}render/?state=${encodedState}`;

    return requestAsync(url).then((response) => {
      return response.body;
    });
  }).then((responses) => {
    const html = responses.join('');

    console.log('html', html);

    fs.writeFileAsync('public/page.html', html).then(() => {
      res.redirect('/pages/edit/id');
    });
  });
});

router.post('/edit/id/add-component', (req, res) => {
  page.content.push({
    id: uuid(),
    type: req.body.type,
  });

  res.redirect('/pages/edit/id');
});

module.exports = router;
