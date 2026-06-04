// Cross-map fetch quest: a mysterious patron wants "the perfect cocktail."
// Collect three ingredients from three different bars, then return.
(function () {
  const BC = window.BC || (window.BC = {});

  BC.quests = {
    cocktail: {
      id: 'cocktail',
      name: 'The Perfect Cocktail',
      ingredients: [
        { id: 'mint', from: 'pour_decisions', label: 'a sprig of garden mint' },
        { id: 'whiskey', from: 'sticky_floor', label: 'the top-shelf whiskey' },
        { id: 'umbrella', from: 'off_key_west', label: 'a tiny paper umbrella' }
      ],
      active(g) { return !!g.run.flags.q_cocktail; },
      start(g) { g.run.flags.q_cocktail = true; g.learn('recipe_cocktail'); },
      has(g, id) { return !!g.run.flags['ingr_' + id]; },
      give(g, id) { g.run.flags['ingr_' + id] = true; },
      count(g) { return this.ingredients.filter(i => this.has(g, i.id)).length; },
      complete(g) { return this.count(g) === this.ingredients.length; },
      ingredientFor(barId) { return this.ingredients.find(i => i.from === barId); },
      needList(g) { return this.ingredients.filter(i => !this.has(g, i.id)).map(i => i.label); }
    }
  };
})();
