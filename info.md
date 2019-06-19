# Lovelace swipe card

A Lovelace card that uses [swiper](http://idangero.us/swiper/) to create a touch slider that lets you flick through multiple cards.
You can use (almost?) all options of swiper, these can be found [here](http://idangero.us/swiper/api/).

## Installation:

You have 2 options, hosted or self hosted (manual). The first option needs internet and will update itself.

# Hosted:

Add the following to resources in your lovelace config:

```yaml
resources:
  - url: https://cdn.jsdelivr.net/gh/bramkragten/custom-ui@master/swipe-card/swipe-card.js
    type: module
```

# Manual:

Download the [swipe-card.js](https://raw.githubusercontent.com/bramkragten/custom-ui/master/swipe-card/swipe-card.js) to `/config/www/custom-lovelace/swipe-card/`. (or an other folder in `/config/www/`)

Add the following to resources in your lovelace config:

```yaml
resources:
  - url: /local/custom-lovelace/swipe-card/swipe-card.js
    type: module
```

## Configuration:

And add a card with type `custom:swipe-card`:

```yaml
- type: custom:swipe-card
  cards: []
```
