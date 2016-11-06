var app = new Vue({
    el: '#app',
    data: {
        cards: cards
    },
    methods: {
        shuffleCards: function () {
            var o = this.cards;            
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);            
            return o;
        }
    }
});