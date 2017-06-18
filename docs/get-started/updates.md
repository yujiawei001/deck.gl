# Udpates


The key is to understanding how to best use deck.gl is to understand the reactive programming paradigm ([Wikipedia](https://en.wikipedia.org/wiki/Reactive_programming), [Link](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)) that the deck.gl is architecture is based on.

- In a reactive application, the entire UI is re-rendered every time something in the application state changes.
- There is no application logic that checks what part of the state changed to make required updates.
- Instead, the UI framework makes the choices about what to update, by comparing (or "diffing") against the last rendered UI.
- deck.gl then the makes minimal changes to the DOM or to WebGL state to account for the differences, and redraws.

The deck.gl model that for the app creates a new set of on layers on every render.
Internally, the new layers are efficiently matched against existing layers using layer ids.


## Creating new layers on every render?

All calculated state (programs, attributes etc) are stored in a state object and this state object is moved forward to the match layer on every render cycle.  The new layer ends up with the state of the old layer (and the props of the new layer), while the old layer is simply discarded for
garbage collecion.


## Properties

Based on the way WebGL works there are two main clases of changes

* **Attributes** - these are big buffers of memory that contain the geometry primitives that describe how the GPU should render your data.
* **Uniforms and Settings** - These are very cheap to change, it is a single variable or setting that changes and then the GPU picks up on next redraw.

Updating attributes is essentially a linear time operation (proportional to the amount of data you are passing to the layer) and should normally be considered expensive and care should taken to avoid unnecessary updates.


## Shallow Equality

Since the reactive programming frameworks conceptually render the entire UI every render cycle, and achieve efficiency by comparing and "diffing" changes between render cycles, it is important that comparisons are fast. Because of this, deck.gl uses shallow equality as the default comparison method except where otherwise specified.



## Data Updates

Once a `data` change has been confirmed by deck.gl it will invalidate all attributes and completely regenerate them.


### Accessors

Accessors. Note that changing the value of an accessor (i.e. supplying a different function to the accessor prop) will not in itself trigger an attribute update. This is because the function identity is a poor indicator of whether an update is needed, and the convenience of using local functions as prop values.

Thus, the code below will not trigger expensive attribute updates, which is what most applications would expect
```js
new Layer({
  getColor: x => x.color, // this creates a new function every render
  getElevation: this._getElevation.bind(this) // bind generates a new function every render
})
```

However, neither will this code
```js
new Layer({
  getColor: pill === 'red' ? this._getRedPill() : this._getBluePill(), // Does not trigger an attribute update!!!
})
```

Here the `updateTriggers` mechanism comes to the rescue.


### Update Triggers

There is no way for deck.gl to know what the programmer intended just by looking at or comparing the functions that are supplied to a `Layer`s accessor props. Instead, the `updateTriggers` property gives you fine grained control, enabling you to tell deck.gl exactly which attributes need to change, and when. In this way you can trigger and update of say instance colors and elevations in response to e.g. a reaggregation operation (see the HexagonLayer) without recaclulating other attributes like positions, picking colors etc.

When the value in an `updateTrigger` change, any attributes that depend on that accessor will get invalidated and recalculated before next render cycle.

```js
new Layer({
  // This does not trigger an update when the value of "pill" changes...
  getColor: pill === 'red' ? this._getRedColors() : this._getBlueColors(),
  // ...but this does!
  updateTriggers: {
  	getColor: pill
  }
})
```
In the above code, deck.gl compares the value of the `getColor` update trigger with its previous value on every render, and whenever it changes, it will regenerate the colors attribute using the function supplied to `getColor` at that time.


### Supplying attributes directly

While the built-in attribute generation functionality is a major part of a `Layer`s functionality, it is possible for applications to bypass it, and supply the layer with precalculated attributes. It requires the application to understand how those attributes are formatted which typically requires consulting the source code.


## Future Possibilities


### Exposing AttributeManagers

Supplying attributes directly can be a powerful way to improve performance, especially in animation scenarios. But calculating them often requires effectively duplicating the attribute calculation logic that is already in the layers.


### Caclulating attributes in workers

Some deck.gl applications use workers to load data and generate attributes to get the processing off the main thread. Modern worker implementations allow ownership of typed arrays to be transferred between threads which takes care of about half of the biggest performance problem with workers (deserialization of calculated data when transferring it between threads).


### Partial Updates

deck.gl currently doesn't implement support for partial updates. Each attribute is always updated completely. Investigations have been done, and for certain use cases it would be possible to let the application specify e.g. a range of changed indices, to significantly limit the work involved in update. However, a completely general solution is likely too complicated (e.g. handling deletions and additions in addition to just replacements), or even intractable (e.g. auto-detecting the changes in large arrays).

