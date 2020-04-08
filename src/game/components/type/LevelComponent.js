// Defines the given entity as a Level
define(['ash'], function (Ash) {
    
    var LevelComponent = Ash.Class.extend({
        
        position: 13,
        isCampable: false,
        notCampableReason: null,
        populationFactor: 1,
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        
        constructor: function (pos, isCampable, notCampableReason, populationFactor, minX, maxX, minY, maxY) {
            this.position = pos;
            this.isCampable = isCampable;
            this.notCampableReason = notCampableReason;
            this.populationFactor = populationFactor;
            this.minX = minX;
            this.maxX = maxX;
            this.minY = minY;
            this.maxY = maxY;
        }
    });

    return LevelComponent;
});
